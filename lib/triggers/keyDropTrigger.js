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
randomUserMessage  - string            = If set, this message will be sent to the winning us from the command above.
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
		trigger.options.dropChance        = options.dropChance        || 0;
		trigger.options.room              = options.room              || undefined;
		trigger.options.dropCommand       = options.dropCommand       || ["!keydrop","!dropkey"];
		trigger.options.addCommand        = options.addCommand        || ["!keyadd","!addkey"];
		trigger.options.queueCommand      = options.queueCommand      || ["!keysleft","!keys"];
		trigger.options.randomUserCommand = options.randomUserCommand || ["!random"];
		trigger.options.randomUserMessage = options.randomUserMessage || false;
		trigger.options.delay             = options.delay             || 3*1000;
		trigger.options.publicDelay       = options.publicDelay       || 5*60*1000;
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
		if(keys instanceof Array) {
			fnd.ws(that.options.dbFile+".bak",JSON.stringify(that.keys,null,4));
			throw null; //now continue to the catch block to reset it
		}
	} catch(err) {
		that.keys = {
			approved: [],
			unapproved: [],
			used: []
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
	app.get('/authenticate', steamlogin.authenticate('/keys/'), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
	});
	app.get('/login', steamlogin.authenticate('/keys/'), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
	});
	app.get('/verify', steamlogin.verify(), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
//		res.send(JSON.stringify(req.user));
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
		} else {
			res.redirect(that.options.web+"/client");
		}
	});

	app.get('/logout', steamlogin.enforceLogin('/keys/'), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		req.logout();
		res.redirect('/keys/login');
	});
	app.get('/test', steamlogin.enforceLogin('/keys/'), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		res.send(JSON.stringify(req.user));
	});
	app.get('/client', steamlogin.enforceLogin('/keys/'), function(req, res) {
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
		} else {
			res.sendFile(__dirname+'/KeyDropTrigger/index.html');
		}
	});
	app.get('/client', steamlogin.enforceLogin('/keys/'), function(req, res) {
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
		} else {
			res.sendFile(__dirname+'/KeyDropTrigger/index.html');
		}
	});
	app.post('/addkey', steamlogin.enforceLogin('/keys/'), function(req,res){
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
				secretname: req.body.secret,
				addedtime: new Date().getTime(),
				message: req.body.message
			}
			that.keys.unapproved.push(key);
			res.json({
				blocked: false,
				error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
				keys: that.options.users.indexOf(req.user.steamid) === -1 ? null : that.keys
			});
		}
	});
	app.post('/delkey', steamlogin.enforceLogin('/keys/'), function(req,res){
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' not allowed access!');
			res.json({error:req.user.username+"/"+req.user.steamid+" is not allowed access"});
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to delete a key!');
			for(var i = 0; i<=keys.unapproved.length; i++) {
				if(that.keys.unapproved[i].addedtime===req.body.time) {
					that.keys.unapproved.splice(i,1);
					res.json({
						error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
						keys: that.keys
					});
					break; //there shouldn't be more than one key with the same time (milliseconds, anyone?) but they might be added manually. I'm like that
				}
			}
		}
	});
	app.post('/getkeys', steamlogin.enforceLogin('/keys/'), function(req,res){
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' not allowed access!');
			res.json({error:req.user.username+"/"+req.user.steamid+" is not allowed access"});
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to view keys!');
			res.json({
				error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
				keys: that.keys
			});
		}
	});
	app.post('/approvekey', steamlogin.enforceLogin('/keys/'), function(req,res){
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' not allowed access!');
			res.json({error:req.user.username+"/"+req.user.steamid+" is not allowed access"});
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to delete a key!');
			for(var i = 0; i<=keys.unapproved.length; i++) {
				if(that.keys.unapproved[i].time===req.body.time) {
					var key = that.keys.unapproved.splice(i,1)[0];
					key.approvedby = req.user.steamid;
					key.approvedtime = new Date().getTime();
					that.keys.approved.push(key);
					res.json({
						error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
						keys: that.keys
					});
					break;
				}
			}
		}
	});
	app.post('/dropkey', steamlogin.enforceLogin('/keys/'), function(req,res){
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' not allowed access!');
			res.json({error:req.user.username+"/"+req.user.steamid+" is not allowed access"});
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to post a key!');
			that._postKey(that._getNextKey(req.body.time||false,req.user.steamid),req.body.public);
			res.json({
				error: fnd.ws(that.options.dbFile,JSON.stringify(that.keys,null,4)) ? false : true,
				keys: that.keys
			});
		}
	});
	app.get('/keys.js', steamlogin.enforceLogin('/keys/'), function(req, res) {
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
		} else {
			res.set('Content-Type', 'text/javascript');
			res.sendFile(__dirname+'/KeyDropTrigger/script.js');
		}
	});
	app.get('/styles.css', steamlogin.enforceLogin('/keys/'), function(req, res) {
		if(that.options.users.indexOf(req.user.steamid) === -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
		} else {
			res.set('Content-Type', 'text/css');
			res.sendFile(__dirname+'/KeyDropTrigger/styles.css');
		}
	});
}
KeyDropTrigger.prototype._getNextKey = function(time,who) {
	var that = this;
	var index = false;
	if(time) {
		for(var i = 0; i<=keys.approved.length; i++) {
			if(that.keys.approved[i].time===req.body.time) {
				index = i;
				break;
			}
		}
	} else {
		index = 0;
	}
	if(index===false) {
		return false;
	}
	var key = that.keys.approved.splice(index,1)[0];
	key.usedby = who;
	key.usedtime = new Date().getTime();
	that.keys.used.push(key);
	return key;
}
KeyDropTrigger.prototype.unuseKey = function(key) {
	delete key.usedby;
	delete key.usedtime;
	this.keys.approved.push(this.keys.used.splice(this.keys.indexOf(key,1))[0]);
}
KeyDropTrigger.prototype._postKey = function(keyToPost,public) {
	this.chatBot.joinChat(this.options.room);
	var that = this;
	var message = {public:"",private:""};
	key = keyToPost || this._getNextKey();
	if(key.message && public) {
		this._unuseKey(keyToPost);
		return false;
	}
	if(!key) { return false; }
	var who;
	if(public) {
		who = this.options.room;
		message.public = "Up for grabs: "+(key.game || "a Mystery Prize")+", donated by "+(key.donor||" an anonymous donor")
			+(key.obfuscatedkey || key.key);
	} else {
		who = this._randomProperty(this.chatBot.rooms()[this.options.room]);
		message.public = "Congratulations to "+this.chatBot.users()[who].player_name+"/https://steamcommunity.com/id/"+who+" for winning";
		message.private = "Congratulations! You won "+(key.game || "a Mystery Prize")+", donated by "+(key.donor||" an anonymous donor")
			+ ". You have a short period to accept it before it goes to another winner or gets posted in chat!";
		if(key.message) {
			message.private += "\nThe instructions for receiving your game are below:\n"+key.message;
			message.info = "Note: The timeout has expired for "+this.chatBot.users()[who].player_name
				+"/https://steamcommunity.com/id/"+who+" to claim their prize. If they have not done so, find a new winner";
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

	setTimeout(function(){
		that._sendMessageAfterDelay(who, "Your time is up! Your "+(key.message ? "gift will now be given to another user." 
			: "key will now be posted publicly"));
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
		this.keys.push(key);
		if(fnd.ws(this.options.dbFile,JSON.stringify(this.keys))) { //this should be changed to a database soon.
			this._sendMessageAfterDelay(userId, "\""+key+"\" has been added to the end of the queue");
		} else {
			this._sendMessageAfterDelay(userId, "\""+key+"\" has been added to the end of the queue, however saving the queue to disk has failed. You may wish to ensure the key has been dropped later and/or posting it elsewhere.");
			this.winston.error("Could not write keys to disk",key);
		}
		return true;
	}
	if(this._stripCommand(message, this.options.queueCommand)) {
		this._sendMessageAfterDelay(roomId, "There are "+this.keys.length+" keys left in the queue");
		return true;
	}
	var query = this._stripCommand(message, this.options.dropCommand);
	if (query || Math.random() < this.options.dropChance) {
		that._postKey(that._getNextKey(false,userId), true);
		return true;
	}
	if(this._stripCommand(message, this.options.randomUserCommand)) {
		that._postKey(that._getNextKey(false,userId), false);
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
