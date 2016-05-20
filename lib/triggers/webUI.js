var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var steamlogin = require('steam-login');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var fsp = require('filendir')
var fs = require('fs');
var bodyParser = require('body-parser');
var request = require('request');
var qs = require('qs');
var cloneDeep=require('lodash.clonedeep');
var stringify = require('json-stringify-safe');
/* WebUI. Does not respond to *any* input on *any* chat. It simply provides an API and default browser client for changing bot settings, such as name, etc. Pull requests are welcome.
admins        = Array     - []                        - Array of steamids of those allowed to access the webui. You can also whitelist an ip address by putting it here (127.0.0.1 is good)
apikey        = string    -                           - steam api key. Unsure if required, will be used if given. Can also be given in chatbot constructor as steamapikey.
secret        = string    - random string (changes)   - You'll want to set this to something, it's the session key. If you don't save it the *first* time, it'll be initialized to a 64byte hex string.
secretFile    = string    - botName/trigname.secret   - Overrides above after first use. Delete to change secret.
sessionStore  = string    - botName/trigname.sessions - Where are the sessions saved?
public        = string    -                           - public path to the options.web directory (including the webUI bit), required for the steam servers to redirect you properly.
cookieName    = string    - "connect.sid"             - name of the cookie used by session middleware. Not sure why you'd want to change it, but whatever

*/

var WebUI = function() {
	WebUI.super_.apply(this, arguments);
};

util.inherits(WebUI, BaseTrigger);

var type = "WebUI";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new WebUI(type, name, chatBot, options);
	trigger.options.admins        = options.admins        || [];
	trigger.options.web           = options.web           || "/api";
	trigger.options.secretFile    = options.secretFile    || chatBot.name+"/"+type+"/"+name+".secret";
	trigger.options.sessionStore  = options.sessionStore  || chatBot.name+"/"+type+"/"+name+".sessions";
	trigger.options.apikey        = options.apikey        || chatBot.options.steamapikey||false;
	trigger.options.apikeyStore   = options.apikeyStore   || chatBot.name+"/"+type+"/"+name+".apikeys";
	trigger.options.public        = trigger.options.public|| false;
	trigger.serverStarted = !options.web; //leftover from webUI origins, keep using?
	trigger.allowMessageTriggerAfterResponse = true;
	return trigger;
};

// I'd like to be able to run functions right before it's unloaded, but I can't get the code to work...
WebUI.prototype._onLoad = function(){
	this.logPrefix = this.chatBot.name+"/"+this.name+": "; //I'm tired of typing this out.
	if(!this.chatBot.options.disableWebServer && !this.serverStarted) {
		this.winston.debug(this.chatBot.name+"/"+this.name+": Starting webserver functions for webUI");
		this._startServer();
	}
	return true;
}
WebUI.prototype._startServer = function(){
	if(this.chatBot.options.disableWebServer || this.serverStarted) {
		this.winston.info(this.chatBot.name+"/"+this.name+": webUI webserver is disabled or already initialized. Not starting webserver functions");
		return false;
	}
	if(!this.chatBot.express) {
		this.winston.error(this.chatBot.name+"/"+this.name+": bot's webserver doesn't exist! I can't do crap!");
		return false;
	}
	this.winston.debug(this.chatBot.name+"/"+this.name+": Starting webserver functions for webUI");
	if(this.options.web===true) { //set default route
		this.options.web = "/api";
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
			fs.writeFileSync('error-webui-'+Date(),err.stack);
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

	this.sockets = this._getSocket(this.options.web+"/client.ws");
	this.sockets.use(function(socket, next) { //enforce sessions for socket.io, found at http://stackoverflow.com/a/25618636/4856479
		sessionMiddleware(socket.request, socket.request.res, next);
	});

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
		if(that.options.admins.indexOf(ip) > -1) { //steam login doesn't actually check the userid for validity, so this works
			req.user = ip;
		}
		if(req.user) {
			that.winston.silly(that.logPrefix+"User: "+JSON.stringify(req.user));
		} else {
			that.winston.silly(that.logPrefix+"NO USER!");
		}
		next();
	});
	app.get('/authenticate', steamlogin.authenticate('/api/'), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
	});
	app.get('/login', steamlogin.authenticate('/api/'), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
	});
	app.get('/verify', steamlogin.verify(), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
//		res.send(JSON.stringify(req.user));
		if(that.options.admins.indexOf(req.user.steamid) === -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
		} else {
			res.redirect(that.options.web+"/client");
		}
	});

	app.get('/logout', steamlogin.enforceLogin('/api/'), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		req.logout();
		res.redirect('/api/login');
	});
	app.get('/test', steamlogin.enforceLogin('/api/'), function(req, res) {
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		res.send(JSON.stringify(req.user));
	});
	app.get('/client', steamlogin.enforceLogin('/api/'), function(req, res) {
		if(that.options.admins.indexOf(req.user.steamid) === -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
			res.redirect("/api/login");
		} else {
			res.sendFile(__dirname+'/WebUI/index.html');
		}
	});
	app.post('/client', function(req,res){
		that.winston.info('###########\n###########\nCLIENT POST\n###########\n###########');
		that.winston.silly(that.logPrefix+'user',JSON.stringify(req.user));
		message = req.user == null ? 'not logged in' : 'hello ' + req.user.username;
		if(that.options.admins.indexOf(req.user.steamid) === -1) {
			that.winston.info('User not allowed access!');
			res.json({error:req.user.username+"/"+req.user.steamid+" is not allowed access"});
		} else {
			that.winston.info('User '+req.user.username+'/'+req.user.steamid+' allowed access to endpoint!');
			that._endpoint(req,res);
		}
	});
	app.get('/webui.js', steamlogin.enforceLogin('/api/'), function(req, res) {
		if(that.options.admins.indexOf(req.user.steamid) === -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
		} else {
			res.set('Content-Type', 'text/javascript');
			res.sendFile(__dirname+'/WebUI/webui.js');
		}
	});
	app.get('/styles.css', steamlogin.enforceLogin('/api/'), function(req, res) {
		if(that.options.admins.indexOf(req.user.steamid) === -1) {
			res.status(403).send("<html><body><h1>Access Denied</h1><h3>"+req.user.username+"/"+req.user.steamid+" is not allowed access");
			req.logout();
		} else {
			res.set('Content-Type', 'text/css');
			res.sendFile(__dirname+'/WebUI/styles.css');
		}
	});
	this.sockets.on('connection', function(socket) {
		socket.emit('USERS',JSON.stringify(that.chatBot.users()));
		socket.emit('ROOMS',JSON.stringify(that.chatBot.rooms()));
		socket.emit('FRIENDS',JSON.stringify(that.chatBot.friends()));
		socket.emit('GROUPS',JSON.stringify(that.chatBot.groups()));
		socket.emit('STATS',JSON.stringify(that._getStats()));
		socket.emit('IGNORES',JSON.stringify(that.chatBot.ignores));
		socket.emit('TRIGGERS',stringify(that._getTriggers()));
		socket.on('USERS', function(data) {
			socket.emit('USERS',JSON.stringify(that.chatBot.users()));
		});
		socket.on('ROOMS', function(data) {
			socket.emit('ROOMS',JSON.stringify(that.chatBot.rooms()));
		});
		socket.on('FRIENDS', function(data) {
			socket.emit('FRIENDS',JSON.stringify(that.chatBot.friends()));
		});
		socket.on('GROUPS', function(data) {
			socket.emit('GROUPS',JSON.stringify(that.chatBot.groups()));
		});
		socket.on('STATS', function(data) {
			socket.emit('STATS',JSON.stringify(that._getStats()));
		});
		socket.on('TRIGGERS', function(data) {
			socket.emit('TRIGGERS',JSON.stringify(that._getTriggers()));
		});
		socket.on('IGNORES', function(data){
			socket.emit('IGNORES',JSON.stringify(that.chatBot.ignores));
		});
		that.chatBot.winston.on('logging', function(transport, level, msg, meta){
			socket.emit('log',JSON.stringify({level:level,msg:msg,meta:JSON.stringify(meta)}));
		});
	});
//	setInterval(function(){that._sendStats(that)},5000);
//	setInterval(function(){that._sendTriggers(that)},5000);
}
WebUI.prototype._respondToEnteredMessage = function(roomId,userId) {
	this.sockets.emit('USERS',JSON.stringify(this.chatBot.users()));
	return false;
}
WebUI.prototype._respondToDisconnect = function(roomId,userId) {
	this.sockets.emit('USERS',JSON.stringify(this.chatBot.users()));
	return false;
}
WebUI.prototype._respondToLeftMessage = function(roomId, userId) {
	this.sockets.emit('USERS',JSON.stringify(this.chatBot.users()));
	return false;
}
WebUI.prototype._respondToKick = function(roomId,kickedId,kickerId) {
	this.sockets.emit('USERS',JSON.stringify(this.chatBot.users()));
	return false;
}
WebUI.prototype._endpoint = function(req,res) {
//	this.sockets.emit('REQUEST',req.body);
	var validTypes = ['send','join','leave','name','kick','ban','lock'
		,'unlock','mod','unmod','status','announce','loadTrigger'
		,'unloadTrigger','removeIgnore','addIgnore'];
	if(validTypes.indexOf(req.body.type)>-1) {
		var err = this['_'+req.body.type](req.body);
		if(err && err instanceof Object) {
			res.json(err);
		} else if(err) {
			res.json({error:err});
		} else {
			res.json({error:false,body:req.body});
		}
	} else {
		res.json({error:"Invalid endpoint",body:req.body});
	}
}
WebUI.prototype.addApiKey = function(userid) {
	var apikey = hat();
	this.apiKeys[apikey] = userid;
	return apikey;
}
WebUI.prototype.checkApiKey = function(key) {
	if(key in this.apiKeys) {
		return this.apiKeys[key];
	}
	return false;
}
WebUI.prototype.getApiKey = function(userid) {
	for(var key in this.apikeys) {
		if(this.apikeys[key]===userid) {
			return key;
		}
	}
}
WebUI.prototype._send = function(body){
	this.winston.silly(body);
	if(!body.target) { return "No chat specified"; }
	if(!body.message) { return "No messages specified"; }
	try {
		this.winston.info(body.target);
		this._sendMessageAfterDelay(body.target, body.message);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._join = function(body) {
	this.winston.silly(body);
	if(!body.target) { return "No chat specified"; }
	try {
		this.chatBot.joinChat(body.target);
		if(body.message) {
			this._sendMessageAfterDelay(body.target, body.message);
		}
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._leave = function(body) {
	this.winston.silly(body);
	if(!body.target) { return "No chat specified"; }
	try {
		if(message) {
			this._sendMessageAfterDelay(body.target, message);
		}
		this.chatBot.leaveChat(body.target);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._name = function(body) {
	this.winston.silly(body);
	if(!body.name||body.name==="") { return "No name specified"; }
	try {
		this.chatBot.setPersonaName(body.name);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._kick = function(body) {
	this.winston.silly(body);
	if(!body.target) { return "No user specified"; }
	if(!body.room) { return "No chat specified"; }
	try {
		this.chatBot.kick(body.room, body.target);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._ban = function(body) {
	this.winston.silly(body);
	if(!body.target) { return "No users specified"; }
	if(!body.rooms) { return "No chat specified"; }
	try {
		this.chatBot.ban(body.room, body.target);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._unban = function(body) {
	this.winston.silly(body);
	if(!body.target) { return "No user specified"; }
	if(!body.room) { return "No chat specified"; }
	try {
		this.chatBot.unban(body.room,target);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._lock = function(body) {
	this.winston.silly(body);
	if(!body.target) { return "No chat specified"; }
	try {
		this.chatBot.lockChat(body.target);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._unlock = function(body) {
	this.winston.silly(body);
	if(!body.target) { return "No chat specified"; }
	try {
		this.chatBot.unlockChat(body.target);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._mod = function(body) {
	this.winston.silly(body);
	if(!body.target) { return "No chat specified"; }
	try {
		this.chatBot.setModerated(body.target);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._unmod = function(body) {
	this.winston.silly(body);
	if(!body.target) { return "No chat specified"; }
	try {
		this.chatBot.setUnmoderated(body.target);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._status = function(body) {
	this.winston.silly(body);
	try {
		var statint = parseInt(body.status);
		if(!body.status || statint.toString!==body.status || statint>6 || statint<0) {
			var ret =  {error:"invalid status",validStatuses:{offline:0,online:1,busy:2,away:3,snooze:4,trade:5,play:6}};
		}
		this.chatBot.setPersonaState(statint);
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._loadTrigger = function(body){
	if(this.chatBot.triggers[body.name]) {
		return "this trigger already exists!";
	}
	if(!body.name || !body.options || !body.trigtype) {
		return "Invalid syntax: 'name, 'type', options{} required";
	}
	try {
		var options = JSON.parse(body.options);
	} catch(err) {
		var options = cloneDeep(body.options);
		console.log(options);
		this.winston.error(err.stack);
//		return "Invalid options!";
	}
	try {
		this.chatBot.addTrigger(body.name, body.trigtype, options)
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. See log";
	}
//	this.sockets.emit('TRIGGERS',this._getTriggers());
}

WebUI.prototype._unloadTrigger = function(body){
	if(!body.name || !this.chatBot.triggers[body.name]) {
		return "Please specify a valid trigger";
	}
	try {
		this.chatBot.removeTrigger(body.name)
	} catch(err) {
		this.winston.error(err.stack);
		return "Unknown error. See log";
	}
//	this.sockets.emit('TRIGGERS',this._getTriggers());
}
WebUI.prototype._addIgnore = function(body){
	if(!body.id||typeof body.id!==string) {
		return "Invalid ID!"
	}
	this.chatBot.ignores[this.chatBot.ignores.length]=body.id;
//	this.sockets.emit('IGNORES',this.chatBot.ignores);
}
WebUI.prototype._removeIgnore = function(body) {
	if(!body.id||typeof body.id!==string) {
		return "Invalid ID!"
	}
	var i = this.chatBot.ignores.indexOf(body.id);
	if(i===0) {
		return "Not ignored!"
	}
	this.chatBot.ignores.splice(i,1);
//	this.sockets.emit('IGNORES',this.chatBot.ignores);
}

WebUI.prototype.makeAnnouncement = function(target, head, body, source) {
	var that = this;
	var post_data = qs.stringify({
		"sessionID" : that.chatBot.steamTrade.sessionID,
		"action" : "post",
		"headline" : head,
		"body" : body
	});
	var post_options = {
		host: "steamcommunity.com",
		port: "80",
		path: "/groups/"+target+"/announcements/create",
		method: "POST",
		headers: {
			"Content-Type" : "application/x-www-form-urlencoded",
			"Content-Length" : post_data.length,
			"cookie" : that.chatBot.cookie
		}
	};
	var post_req = http.request(post_options, function(res) {
		res.setEncoding("utf8");
		res.on("data", function(chunk) {
			that.winston.info("Announcement created: " + head);
			if(source) {
				that.sendMessageAfterDelay(source, "Announcement created: " + head);
			} else {
				return head;
			}
		});
	});
	post_req.write(post_data);
	post_req.end();
	this.winston.debug(post_data)
	this.winston.debug(post_options);
}
/*
WebUI.prototype._announce = function(body) {
	this.winston.silly(body);
	try {
		var success = this._makeAnnouncement(body.target,body.headline,body.body,body.source);
		console.log(success);
	} catch(err) {
		return "Unknown error. Please check logs";
	}
}
WebUI.prototype._makeAnnouncement = function(target, head, body, source) {
	var that = this;
	try {
		var uri = 'https://steamcommunity.com/groups/'+target+'/announcements/create';
		var post_data = {
			"sessionid" : that.chatBot.steamTrade.sessionID,
//			"sessionID" : that.chatBot.steamTrade.sessionID,
			"action" : "post",
			"headline" : head,
			"body" : body
		}
		that.winston.debug('POSTING announcement');
		return request({method:'POST', url:uri, jar:that.chatBot.steamTrade._j}, function(error, response, body){
			try {
				that.winston.info("Announcement created: " + head);
//				if(source) {
//					that.sendMessageAfterDelay(source, "Announcement created: " + head);
//				} else {
					console.log(head);
//				}
				console.log('error',error);
				console.log('response',response);
				console.log('body',body);
				fs.writeFileSync('response'+(Date())+'.txt',JSON.stringify(response));
			}catch(err){
				console.log(err.stack);
			}
		});
	}catch(err){
		console.log(err.stack);
	}
}
*/
WebUI.prototype._getStats = function() {
	var meminfo = process.memoryUsage();
	var stats = {
		startTime: this.chatBot.startTime,
		connected: this.chatBot.connected,
		muted: this.chatBot.muted,
		sinceStart: process.hrtime(this.chatBot.startTime),
		platform: process.platform,
		arch: process.arch,
		heapUsed: meminfo.heapUsed,
		heapTotal: meminfo.heapTotal,
		rss: meminfo.rss,
		botVersion: this.chatBot.version,
		nodeVersion: process.version
	}
	if(this.chatBot.logonTime) {
		stats.logonTime = this.chatBot.logonTime;
		stats.sinceLogon = process.hrtime(this.chatBot.logonTime);
	}
	if(this.chatBot.logoffTime) {
		stats.logoffTime = this.chatBot.logoffTime,
		stats.sinceLogoff = process.hrtime(this.chatBot.logoffTime);
	}
	return stats;
}
WebUI.prototype._getTriggers = function(){
	var triggers = {};
	for(var trigger in this.chatBot.triggers) {
		var trig = this.chatBot.triggers[trigger];
		triggers[trigger] = { type:trig.type, name:trig.name, options:{}}
		for(var option in trig.options){
			if(option.toLowerCase().indexOf('apikey')===-1 &&
				option.toLowerCase().indexOf('secret')===-1 &&
				option.toLowerCase().indexOf('pass')===-1 &&
				option.toLowerCase().indexOf('client')===-1 &&
				!(trig.options[option] instanceof Function)
			){
				triggers[trigger].options[option] = trig.options[option];
			}
		}
	}
	return triggers;
}
