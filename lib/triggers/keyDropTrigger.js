var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var fs = require('fs');
var fnd = require('filendir');
var steamlogin = require('steam-login');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var fsp = fnd; //ripping code out of notificationtrigger
var bodyParser = require('body-parser');
var request = require('request');
var qs = require('qs');
var cloneDeep=require('lodash.clonedeep');
var stringify = require('json-stringify-safe');
/*
Trigger that stores keys for keydrops in a given groupchat. Attempts to join the groupchat before sending the message to make sure chat hasn't crashed.
Options:
users              - Array[String]     = array of users allowed to use commands (ie, admins)room               - string            = room(steamid64) this command is associated with
dropCommand        - string(!keydrop)  = command to drop a key
dropChance         - float(0)          = chance that the bot will drop a key randomly (per-message). Probably keep this low. valid values 0-1. 0-0.02 is probably good. (0.02 is 1 in 50 chance)
addCommand         - string(!keyadd)   = command to add a key
queueCommand       - string(!keysleft) = command to check how many keys are left
randomUserCommand  - string(!random)   = command to choose a random user from those in the chat and send them the message below, if set
delay              - int(3000)         = delay before key is sent, in ms. Defaults to 3s.
publicDelay        - int(5*60*1000)    = delay before keys sent privately are posted publicly
dbFile             - string            = database file. This is a flatfile containing json. Defaults to BOTNAME/TRIGGERNAME.db.
infoUsers          - array             = list of users who should be told when a gift needs to be rerolled.
*/

var KeyDropTrigger = function() {
	KeyDropTrigger.super_.apply(this, arguments);
};

util.inherits(KeyDropTrigger, BaseTrigger);

var type = "KeyDropTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new KeyDropTrigger(type, name, chatBot, options);
		trigger.options.blocked           = options.blocked           || [];
		trigger.options.dropChance        = options.dropChance        || 0;
		trigger.options.room              = options.room              || undefined;
		trigger.options.dropCommand       = options.dropCommand       || ["!keydrop","!dropkey"];
		trigger.options.addCommand        = options.addCommand        || ["!keyadd","!addkey"];
		trigger.options.queueCommand      = options.queueCommand      || ["!keysleft","!keys"];
		trigger.options.randomUserCommand = options.randomUserCommand || ["!random"];
		trigger.options.delay             = options.delay             || 500;
		trigger.options.publicDelay       = options.publicDelay       || 30*60*1000;
		trigger.options.web               = options.web               || "/keys";
		trigger.options.secretFile        = options.secretFile        || chatBot.name+"/"+type+"/"+name+".secret";
		trigger.options.sessionStore      = options.sessionStore      || chatBot.name+"/"+type+"/"+name+".sessions";
		trigger.options.apikey            = options.apikey            || chatBot.options.steamapikey||false;
		trigger.options.apikeyStore       = options.apikeyStore       || chatBot.name+"/"+type+"/"+name+".apikeys";
		trigger.options.public            = options.public            || false;
		trigger.options.infoUsers         = options.infoUsers         || [];
		trigger.options.dbFile = options.hasOwnProperty('dbFile') ? options.dbFile : chatBot.name + '/' + name + ".db";
		//trigger.keys was here, moved below for formatting
		trigger.serverStarted  = !options.web; //leftover from webUI origins, keep using?
		trigger.respectsMute   = false;
	return trigger;
};
//A good bit of this was ripped right out of WebUI, since I want most of the same basic functionality. Only the actual page contents change.
KeyDropTrigger.prototype._onLoad = function(){
	var that = this;
	this.logPrefix = this.chatBot.name+"/"+this.name+": "; //I'm tired of typing this out.
	if(!this.chatBot.options.disableWebServer && !this.serverStarted) {
		this.winston.debug(this.chatBot.name+"/"+this.name+": Starting webserver functions for keydroptrigger");
		this._startServer();
	}
	this._refreshFile();
	return true;
}
KeyDropTrigger.prototype._refreshFile = function(){ //move into its own function for reuse (this way can edit file manually)
	var that = this;
	try {
		that.keys = JSON.parse(fs.readFileSync(that.options.dbFile));

		//the format has changed, so if it's still an array we'll back it up and reset it.
		if(that.keys instanceof Array) {
			fnd.ws(that.options.dbFile+".bak",JSON.stringify(that.keys,null,4));
			that.keys = {
				approved: {},
				unapproved: {},
				used: {},
				oldKeys: that.keys
			}
		}
	} catch(err) {
		that.keys = {
			approved: {},
			unapproved: {},
			used: {}
		}
	}
}

KeyDropTrigger.prototype._startServer = function(){
	if(this.chatBot.options.disableWebServer || this.serverStarted) {
		this.winston.info(this.chatBot.name+"/"+this.name+": webserver is disabled or already initialized. Not starting webserver functions");
		return false;
	}
	if(!this.chatBot.express) {
		this.winston.error(this.chatBot.name+"/"+this.name+": bot's webserver doesn't exist! I can't do crap!");
		return false;
	}
	this.winston.debug(this.chatBot.name+"/"+this.name+": Starting webserver functions");
	if(this.options.web===true) { //set default route
		this.options.web = "/keys";
	}
	var that = this;
	try {
		this.options.secret = JSON.parse(fs.readFileSync(this.options.secretFile));
	} catch(err) {
		this.options.secret = require('crypto').randomBytes(64).toString('hex');
		fsp.ws(this.options.secretFile,this.options.secret);
	}
	try {
		this.apikeys = JSON.parse(fs.readFileSync(this.options.apikeyStore));
	} catch(err) {
		this.apikeys = {};
		fsp.ws(this.options.apikeyStore,JSON.stringify(this.apikeys));
	}
	var fslogfunc = function(log) {
		try {
			that.winston.info(this.logPrefix+log);
		} catch(err) {
			console.log(err.stack);
			fs.writeFileSync('error-keydroptrigger-'+Date(),err.stack); //why is this here? I can't remember...
		}
	}
	var fsopts = {
		path:this.options.sessionStore,
		ttl:1800,
		logFn:fslogfunc
	}

	var sessionMiddleware = session({
		store: new FileStore(fsopts),
		secret: this.options.secret,
		resave: false,
		saveUninitialized: false
	})

/*  //I don't think we'll be using websockets here.
	this.sockets = this._getSocket(this.options.web+"/client.ws");
	this.sockets.use(function(socket, next) { //enforce sessions for socket.io, found at http://stackoverflow.com/a/25618636/4856479
		sessionMiddleware(socket.request, socket.request.res, next);
	});
*/

	var app = this._addRouter(this.options.web);
	app.use(sessionMiddleware);
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(steamlogin.middleware({
		realm: this.options.public,
		verify: this.options.public+'/verify',
		apiKey: this.options.apikey
	}));
	app.use(function(req, res, next) {
		that._refreshFile();
		var ip = that.chatBot._getClientIp(req); //special case to allow ip addresses (127.0.0.1)
		if(that.options.users.indexOf(ip) > -1) { //steam login doesn't actually check the userid for validity, so this works
			req.user = {steamid:ip,username:"unknown"};
		}
		if(req.user) {
			that.winston.silly(that.logPrefix+"User: "+JSON.stringify(req.user));
		} else {
			that.winston.silly(that.logPrefix+"NO USER!");
		}
		next();
	});
	app.get('/authenticate', steamlogin.authenticate(that.options.web), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
	});
	app.get('/login', steamlogin.authenticate(that.options.web), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
	});
	app.get('/verify', steamlogin.verify(), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
//		res.send(JSON.stringify(req.user));
		if(that.options.blocked.indexOf(req.user.steamid) > -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
		} else {
			res.redirect(that.options.web+"/client");
		}
	});

	app.get('/logout', steamlogin.enforceLogin(that.options.web), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		req.logout();
		res.redirect('/keys/login');
	});
	app.get('/client', steamlogin.enforceLogin(that.options.web), function(req, res) {
		if(that.options.blocked.indexOf(req.user.steamid) > -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
//		} else if(that.options.users.indexOf(req.user.steamid) > -1) {
//			res.sendFile(__dirname+'/KeyDropTrigger/control.html');
		} else {
			res.sendFile(__dirname+'/KeyDropTrigger/index.html');
		}
	});
	app.post('/addkey', steamlogin.enforceLogin(that.options.web), function(req,res){
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		if(that.options.blocked.indexOf(req.user.steamid) > -1) { //later: || that.keys.blockedUsers.indexOf(req.user.steamid) > -1) {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' not allowed access!');
			res.json({blocked:true,error:req.user.username+"/"+req.user.steamid+" is not allowed access"});
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to add a key!');
			var key = {
				game: req.body.game,
				key: req.body.key,
				obfuscatedkey: req.body.obfuscatedkey,
				addedby: req.user.steamid,
				donor: req.body.donor,
				secretname: req.body.secretname,
				addedtime: new Date().getTime().toString(),
				message: req.body.message
			}
			that.keys.unapproved[key.addedtime]=key;
			res.json({
				blocked: false,
				admin: that.options.users.indexOf(req.user.steamid) === -1 ? false : true,
				error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
				keys: that._getKeysForUser(req.user.steamid)
			});
		}
	});
	app.post('/delkey', steamlogin.enforceLogin(that.options.web), function(req,res){
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			if(req.body.time in that.keys.approved && that.keys.approved[req.body.time].addedby===req.user.steamid) {
				delete that.keys.approved[req.body.time];
				res.json({
					error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
					admin: false,
					keys: that._getKeysForUser(req.user.steamid)
				});
			} else if(req.body.time in that.keys.unapproved && that.keys.unapproved[req.body.time].addedby===req.user.steamid) {
				delete that.keys.unapproved[req.body.time];
				res.json({
					error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
					admin: false,
					keys: that._getKeysForUser(req.user.steamid)
				});
			/* //don't allow users to remove keys after they've been dropped, we want to keep a record.
			} else if(req.body.time in that.keys.used && that.keys.used[req.body.time].addedby===req.user.steamid) {
				delete that.keys.used[req.body.time];
				res.json({
					error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
					keys: that._getKeysForUser(req.user.steamid)
				});
			*/
			} else {
				that.winston.info('User '+req.user.username+'/'+req.user.steamid+' not allowed access!');
				res.json({error:req.user.username+"/"+req.user.steamid+" is not allowed access to delete this key."});
			}
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to delete a key!');
			var done = false;
			if(req.body.time in that.keys.approved) {
				delete that.keys.approved[req.body.time];
				res.json({
					error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
					admin: true,
					keys: that.keys
				});
			} else if(req.body.time in that.keys.unapproved) {
				delete that.keys.unapproved[req.body.time];
				res.json({
					error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
					admin: true,
					keys: that.keys
				});
			} else if(req.body.time in that.keys.used) {
				delete that.keys.used[req.body.time];
				res.json({
					error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
					admin: true,
					keys: that.keys
				});
			}
		}
	});
	app.post('/getkeys', steamlogin.enforceLogin(that.options.web), function(req,res){
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to view own keys only!');
			res.json({
				error: false,
				keys: that._getKeysForUser(req.user.steamid),
				admin:false
			});
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to view keys!');
			res.json({
				error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
				admin:true,
				keys: that.keys
			});
		}
	});
	app.post('/approvekey', steamlogin.enforceLogin(that.options.web), function(req,res){
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' not allowed access!');
			res.json({error:req.user.username+"/"+req.user.steamid+" is not allowed access"});
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to approve a key!');
			if(req.body.time in that.keys.unapproved) {
				var key = that.keys.unapproved[req.body.time];
				delete that.keys.unapproved[req.body.time];
				key.approvedby = req.user.steamid;
				key.approvedtime = new Date().getTime().toString();
				that.keys.approved[key.addedtime]=key;
				res.json({
					error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
					admin: true,
					keys: that.keys
				});
			} else {
				res.json({
					error: "No such key",
					keys: that.keys,
					admin: true
				});
			}
		}
	});
	app.post('/dropkey', steamlogin.enforceLogin(that.options.web), function(req,res){
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' not allowed access!');
			res.json({error:req.user.username+"/"+req.user.steamid+" is not allowed access!"});
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to post a key!');
			if(that._postKey(req.body.time||false,req.user.steamid,req.body.public==='true')) {
				res.json({
					error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
					keys: that.keys,
					admin: true
				});
			} else {
				fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4));
				res.json({error: "No such key or key unavailable",keys:that.keys});
			}
		}
	});
	app.get('/script.js', steamlogin.enforceLogin(that.options.web), function(req, res) {
		res.set('Content-Type', 'text/javascript');
		res.sendFile(__dirname+'/KeyDropTrigger/script.js');
	});
	app.get('/styles.css', steamlogin.enforceLogin(that.options.web), function(req, res) {
//		if(that.options.users.indexOf(req.user.steamid) === -1) {
			res.set('Content-Type', 'text/css');
			res.sendFile(__dirname+'/KeyDropTrigger/styles.css');
//		} else {
//			res.set('Content-Type', 'text/css');
//			res.sendFile(__dirname+'/KeyDropTrigger/control.css');
//		}
	});
}
KeyDropTrigger.prototype._getKeysForUser = function(who) {
	if(this.options.users.indexOf(who) > -1) {
		return this.keys;
	}
	var keys = {approved:{},used:{},unapproved:{}};
	for (var i in this.keys.unapproved) {
		if(this.keys.unapproved[i].addedby===who) {
			keys.unapproved[i] = this.keys.unapproved[i];
		}
	}
	for (var i in this.keys.approved) {
		if(this.keys.approved[i].addedby===who) {
			keys.approved[i] = this.keys.approved[i];
		}
	}
	for (var i in this.keys.used) {
		if(this.keys.used[i].addedby===who) {
			keys.used[i] = this.keys.used[i];
		}
	}
	keys.mine = true;
	return keys;
}
KeyDropTrigger.prototype._getNextKey = function(time,who) {
	var that = this;
	var index = time || Object.keys(that.keys.approved)[0];
	if(!time || !index || !that.keys.approved[index]) {
		return false;
	}
	var key = that.keys.approved[index];
	key.usedby = who;
	key.usedtime = new Date().getTime().toString();
	that.keys.used[key.addedtime]=key;
	delete that.keys.approved[index];
	return key;
}
KeyDropTrigger.prototype._unuseKey = function(key) {
	delete key.usedby;
	delete key.usedtime;
	delete this.keys.used[key.addedtime];
	this.keys.approved[key.addedtime] = key;
}
KeyDropTrigger.prototype._postKey = function(time,who,public) {
	this.chatBot.joinChat(this.options.room);
	var that = this;
	var message = {public:"",private:""};
	key = this._getNextKey(time,who);
	if(!key) { return false; }
	if(key.message && public) {
		this._unuseKey(key.addedtime);
		return false;
	}
	var who;
	if(public) {
		who = this.options.room;
		message.public = "Up for grabs: "+(key.game || "a Mystery Prize")+", donated by "+(key.donor||" an anonymous donor")
			+": "+(key.obfuscatedkey || key.key);
	} else {
		who = this._randomProperty(this.chatBot.rooms()[this.options.room]);
		message.public = "Congratulations to "+this.chatBot.users()[who].player_name+"/https://steamcommunity.com/profiles/"+who+" for winning "
			+ key.game + ", donated by "+(key.donor||" an anonymous donor")+".";
		message.private = "Congratulations! You won "+(key.game || "a Mystery Prize")+", donated by "+(key.donor||" an anonymous donor")
			+ ". You have a short period to accept it before it goes to another winner or gets posted in chat!";
		if(key.message) {
			message.private += "\nThe instructions for receiving your game are below:\n"+key.message;
			message.info = "Note: The timeout has expired for "+this.chatBot.users()[who].player_name
				+"/https://steamcommunity.com/profiles/"+who+" to claim their prize. If they have not done so, find a new winner";
		} else {
			message.private += "Your key is: " + (key.key || key.obfuscatedkey);
			message.delayed = "The key sent to the winner for "+(key.game || "a Mystery Prize")+", donated by "
				+ (key.donor||" an anonymous donor")+" was: "+(key.obfuscatedkey || key.key)
				+ ". If they haven't used it yet, you are free to do so!";
		}
	}
	key.winner = who;

	setTimeout(function(){

		that._sendMessageAfterDelay(that.options.room, message.public)
	}, that.options.delay);
	this.winston.debug("Public msg to "+that.options.room+" delayed for ",that.options.delay+"ms");

	setTimeout(function(){
		if(!public) {
			that._sendMessageAfterDelay(who, "Your time is up! Your "+(key.message ? "gift will now be given to another user." 
				: "key will now be posted publicly"));
		}
		if(message.delayed) {
			that._sendMessageAfterDelay(that.options.room, message.delayed);
		}
		if(message.info) {
			for(var i in that.options.infoUsers) {
				that._sendMessageAfterDelay(that.options.infoUsers[i], message.info);
			}
		}
	},that.options.publicDelay);
	if(message.private) {
		setTimeout(function(){
			that._sendMessageAfterDelay(who, message.private);
		},that.options.delay);
	}
	this.winston.debug("Private msg to "+who+" delayed for",that.options.delay);

	return true;
}
// Return true if a message was sent
KeyDropTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
KeyDropTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

KeyDropTrigger.prototype._respond = function(roomId, userId, message) {
	var that = this;
	var toId = roomId || userId;
	var query = this._stripCommand(message, this.options.addCommand);
	if (query && query.params[1]) {
		query.params.splice(0,1); //dump the command.
		var key = query.params.join(" ");
		this.keys.unapproved[key.addedtime]=key;
		if(fnd.ws(this.options.dbFile,JSON.stringify(this.keys))) { //this should be changed to a database soon.
			this._sendMessageAfterDelay(userId, "\""+key+"\" has been added to the end of the unapproved queue");
		} else {
			this._sendMessageAfterDelay(userId, "\""+key+"\" has been added to the end of the queue, however saving the queue to disk has failed. You may wish to ensure the key has been dropped later and/or posting it elsewhere.");
			this.winston.error("Could not write keys to disk",key);
		}
		return true;
	}
	if(this._stripCommand(message, this.options.queueCommand)) {
		this._sendMessageAfterDelay(roomId, "There are currently "+Object.keys(this.keys.unapproved).length+" unapproved, "+Object.keys(this.keys.approved).length+" approved, and "+Object.keys(this.keys.used).length+" used keys in the queue");
		return true;
	}
	var query = this._stripCommand(message, this.options.dropCommand);
	if (query || Math.random() < this.options.dropChance) {
		that._postKey(false,userId, true);
		return true;
	}
	if(this._stripCommand(message, this.options.randomUserCommand)) {
		that._postKey(false, userId, false);
		return true;
	}
	return false;
}

KeyDropTrigger.prototype._stripCommand = function(message,command) {
	if(command instanceof Array) {
		for(i=0; i<=command.length;i++) {
			var ret = this._stripCommand(message, command[i]);
			if(ret) return ret;
		}
	} else {
		if (command && message && message.toLowerCase().indexOf(command.toLowerCase() + " ") === 0) {
			return {message: message, params: message.split(" ")};
		}
		if (command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
			return {message: message, params: message.split(" ")};
		}
	}
	return null;
}
KeyDropTrigger.prototype._randomProperty = function (obj) {
    var keys = Object.keys(obj)
    return keys[ keys.length * Math.random() << 0];
};
