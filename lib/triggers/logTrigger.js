var util = require("util");
var winston = require("winston");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var express = require("express");
var handySanitizer = require("sanitize-filename");
var serveIndex = require("serve-index");
var fs = require("fs");
/* Trigger that logs chat messages to files by groupchat "botname/logs/groupsteamid64.log". Removes blank lines
logDir        = string    - "./botname/logs" - where to place the logfiles. Directory will be created if it doesn't exist. Set to "." for current directory.
prefix        = [usr,grp] - ["u","g"]        - what to prefix the logfiles with. After this comes the defined "name" (if defined; see next option) or
						steamid64, and then the suffix. Set to ["",""] to remove.
suffix        = [usr,grp] - [".txt",".txt"]  - what to append the log filename with. Set to ["",""] for nothing.
roomNames     = {}        - {}               - object containing group names by steamid64, to be used in filenames. {"steamid64":"GroupName","steamid64":"GroupName"}
logUserChats  = bool      - true             - log individual chats with useårs or no?
logGroupChats = bool      - true             - log individual group chats or no? Defaults to true.
logGlobal     = bool/Str  - "./botname/logs/global.txt" - log *all* chats to a global file as json? Set to "false" to disable. Makes winston playback and
								other processing simple. file is still pretty easy to read
logConsole    = bool      - true             - Show logs in console?
linesToSend   = int       - 500              - How many lines of history to send to the webserver? Can be overriden with ?lc=
web           = string    - "/logs"          - Should we enable the webserver portion? Live logs and logfiles.
						- Set to false to disable. Set to true to not prefix logs with anything.
						- Otherwise set as a url path prefix for this plugin.
liveURL       = string    - "/live"          - where do you want to serve the "live" log (stuff shows up as it happens).
						This will be prefixed unless above (web) is explicitly 'true'
logURL        = string    - "/files"         - where do you want to serve the logfiles (static .txt files). route comes before this.
						This will be prefixed unless above (web) is explicitly 'true'
rooms         = array     -                  - universal trigger option. If you only want certain groups to be logged.
ignore        = array     -                  - universal trigger option. If you want certain groups to *not* be logged.
pingTimer     = int       - 5000             - How often should the server ping the client?
						- I have set the ping default to 5s instead, and am now using the built-in ping packet instead of my own packet.
						- Supposedly this shouldn't be needed if your server is set up right, but I'm getting reports of people being disconnected.
wsURL         = string    - false            - Only changes logging: If this doesn't work because of a proxy or some such, set the public/visible url of your server here.
						- Use ws:// for http and ws:// for https. Set to false to not use a different url for websocket (default).
defaultStyle  = string    - "default.css"    - Name of a file from the logTriggers css folder. This will be the default style applied to the live logs.
*/

var LogTrigger = function() {
	LogTrigger.super_.apply(this, arguments);
};

util.inherits(LogTrigger, BaseTrigger);

var type = "LogTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new LogTrigger(type, name, chatBot, options);
	trigger.options.defaultStyle  = options.defaultStyle  || "default.css";
	trigger.options.web           = options.web           || "/logs";
	trigger.options.pingTimer     = options.pingTimer     || 5000;
	trigger.options.liveURL       = options.liveURL       || "/live";
	trigger.options.logURL        = options.logURL        || "/files";
	trigger.options.linesToSend   = options.linesToSend   || 500;
	trigger.options.serverPort    = options.serverPort    || false;
	trigger.options.logDir        = options.logDir        || ("./logs/"+chatBot.name);
	trigger.options.roomNames     = options.roomNames     || {};
	trigger.options.prefix        = options.prefix        || [ "u-" , "g-" ];
	trigger.options.suffix        = options.suffix        || [ ".txt" , ".txt" ];
	trigger.options.logUserChats  = options.logUserChats===false?false: true;
	trigger.options.logGlobal     = options.hasOwnProperty("logGlobal") && options.logGlobal!==true ? options.logGlobal : trigger.options.logDir+"/global.txt";
	trigger.options.logGroupChats = options.logGroupChats ===false?false:true;
	trigger.options.logConsole    = options.logConsole===false?false:true;
	trigger.respectsMute          = false;
	trigger.respectsFilters       = false;
	trigger.respectsGlobalFilters = false;
	trigger.logs = {users:{},groups:{}};
	trigger.lineCount = 0;
	require("mkdirp").sync(trigger.options.logDir); //this should only need to be done once.
	trigger.serverStarted = !options.web; //basically, if we don't want a webserver pretend it's already been started.
	trigger.allowMessageTriggerAfterResponse = true;
	return trigger;
};

// I'd like to be able to run functions right before it's unloaded, but I can't get the code to work...
LogTrigger.prototype._onLoad = function(){
	if(!this.chatBot.options.disableWebServer && !this.serverStarted) {
		this.winston.debug(this.chatBot.name+"/"+this.name+": Starting webserver functions for logTrigger");
		this._startServer();
	}
	if(this.options.logGlobal) {
		this._global(null,null, "Global log initiated","notif",null);
	}
	return true;
}

LogTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	if(this.options.logGlobal) {
		this._global(roomId, userId, " has joined chat","join",null);
	}
	return false;
}
LogTrigger.prototype._respondToLeftMessage = function(roomId, userId) {
	if(this.options.logGlobal) {
		this._global(roomId, userId,"has left chat","left",null);
	}
	return false;
}
LogTrigger.prototype._respondToKick = function(roomId,kickedId,kickerId) {
	if(this.options.logGlobal) {
		this._global(roomId, kickedId, "has been kicked","kick",kickerId);
	}
	return false;
}
LogTrigger.prototype._respondToDisconnect = function(roomId,userId) {
	if(this.options.logGlobal) {
		this._global(roomId, userId, "has disconnected ","disconnect",null);
	}
	return false;
}
LogTrigger.prototype._respondToBan = function(roomId,bannedId,bannerId) {
	if(this.options.logGlobal) {
		this._global(roomId, bannedId, "has been banned","ban", bannerId);
	}
	return false;
}

LogTrigger.prototype._respondToSentMessage = function(toId, message) {
	if(this.chatBot.steamFriends.personaStates && toId in this.chatBot.steamFriends.personaStates) {
		this._respondToFriendMessage(this.chatBot.steamClient.steamID, "to: "+toId+"; message: "+message);
	} else {
		this._respondToChatMessage(toId,this.chatBot.steamClient.steamID,message);
	}
	return false; //I don't know why anyone else would need to see what messages the bot is sending, but whatever.
}

LogTrigger.prototype._respondToFriendMessage = function(userId, message) {
	var that = this;
	if(that.options.logUserChats||that.options.logConsole) { // log user messages
		that.winston.debug(that.chatBot.name+"/"+that.name+": Logging message from "+userId);
		if(!(that.logs.users[userId] && that.logs.users[userId].log instanceof Function)) {
			var filename = that.options.logDir+"/"+that.options.prefix[0]+userId+that.options.suffix[0];
			that.winston.info(that.chatBot.name+"/"+that.name+": Initiating user log "+filename);
			that.logs.users[userId] = new winston.Logger;
			if(that.options.logUserChats) {
				that.logs.users[userId].add(winston.transports.File, {colorize: false,timestamp: false,filename: filename,json:false});
			}
			if(that.options.logConsole === false) {
				that.logs.users[userId].remove(winston.transports.Console);
			}
		}
		if(that.logs.users[userId].timeout) {
			clearTimeout(that.logs.users[userId].timeout); //Remove a timeout if it exists. It will be reset.
		}
		//remove the logger after 5 min. It will be re-added if necessary. Why keep them around for every user that only sends a single message?
		that.logs.users[userId].timeout = setTimeout(function(){delete that.logs.users[userId]},300000);
		that.logs.users[userId].info(that._timestamp() + that._username(userId) + that._message(message),function(){
			that.winston.debug(that.chatBot.name+"/"+that.name+": logged user message");
		});
	}
	if(this.options.logGlobal) {
		this._global(null, userId, message,"user",null);
	}
	return false;
}
LogTrigger.prototype._respondToChatMessage = function(roomId, userId, message) {
	var that = this;
	if(this.options.logGroupChats === true||this.options.logConsole) {
		this.winston.debug(this.chatBot.name+"/"+this.name+": Logging message from "+userId+" in "+roomId);
		if(!(this.logs.groups[roomId] && this.logs.groups[roomId].log instanceof Function)) {
			var filename = that.options.logDir+"/"+that.options.prefix[1]+handySanitizer(that.options.roomNames[roomId]||roomId)+that.options.suffix[1];
			that.winston.info(that.chatBot.name+"/"+that.name+": "+roomId+ " Initiating group log "+filename);
			that.logs.groups[roomId] = new winston.Logger;
			if(that.options.logGroupChats) {
				that.logs.groups[roomId].add(winston.transports.File, {colorize: false,timestamp: false,filename: filename,json:false});
			}
			if(that.options.logConsole === false) {
				that.logs.groups[roomId].remove(winston.transports.Console);
			}
		}
		this.logs.groups[roomId].info(this._timestamp() + this._username(userId) + this._message(message), function(){
			that.winston.debug(that.chatBot.name+"/"+that.name+": logged groupchat message");
		});
	};
	if(this.options.logGlobal) {
		this._global(roomId, userId, message,"group", null);
	}
	return false;
}
LogTrigger.prototype._global = function(roomId, userId, message, type, actedId) {
	var that = this;
	if(that.options.logGlobal && !(this.logs.global && this.logs.global.info instanceof Function)) {
		that.winston.info(that.chatBot.name+"/"+that.name+": Initializing global logfile");
		that.logs.global= new (winston.Logger)();
		require("touch").sync(that.options.logGlobal);
		that.logs.global.add(winston.transports.File,{filename:that.options.logGlobal,json:true,timestamp:false});
		that.logs.global.stream({start: -1}).on("log", function(log){
			that.lineCount++;
		});
	}
	that.lineCount++;
	var log = {
		time:(new Date()-0),
		type:type,
		roomId:roomId,
		userId:userId,
		actedId:actedId,
		displayName:((that.chatBot.steamFriends.personaStates && userId in that.chatBot.steamFriends.personaStates)
		? (that.chatBot.steamFriends.personaStates[userId].player_name)
		: userId) + "",
		actedName:(actedId === null
		? null
		: ((that.chatBot.steamFriends.personaStates && actedId in that.chatBot.steamFriends.personaStates)
		? (that.chatBot.steamFriends.personaStates[actedId].player_name)
		: actedId) + ""),
		message:message
	}
	this.logs.global.info(message,log,function(){
		that.winston.debug(that.chatBot.name+"/"+that.name+": logged to global log");
	});
	that._sendSockets(log);
}
LogTrigger.prototype._username = function(steamId) {
	if(this.options.html === true) {
		return '<a class="username" href="https://steamcommunity.com/profiles/'+steamId+'">'
			+ ((this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates)
			? this.chatBot.steamFriends.personaStates[steamId].player_name
			: steamId)
			+ '</a> ';
	} else {
		return ((this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates)
		? (this.chatBot.steamFriends.personaStates[steamId].player_name + "/"+steamId)
		: steamId) + " ";
	}
}
LogTrigger.prototype._message = function(message) {
	if(this.options.html === true) {
		return String('<span class="message">'+message+'</span></p>').replace(/\n\n+/g,'\n');
	} else {
		return message.replace(/\n\n+/g,'\n');
	}
}
String.prototype._pad = function (length, character) {
	return new Array(length - this.length + 1).join(character || " ") + this;
}
LogTrigger.prototype._timestamp = function() {
	var date = new Date();
	var string = String(date.getHours())._pad(2,"0") + ":"
                   + String(date.getMinutes())._pad(2,"0") + ":"
                   + String(date.getSeconds())._pad(2,"0");
	if(this.options.html === true) {
		return '<p><span class="timestamp">'+string+'</span> ';
	}
	return string+" ";
}

LogTrigger.prototype._startServer = function(){
	if(this.chatBot.options.disableWebServer || this.serverStarted) {
		this.winston.info(this.chatBot.name+"/"+this.name+": logTrigger webserver is disabled or already initialized. Not starting webserver functions");
		return false;
	}
	if(!this.chatBot.express) {
		this.winston.error(this.chatBot.name+"/"+this.name+": bot's webserver doesn't exist! I can't do crap!");
		return false;
	}
	this.winston.debug(this.chatBot.name+"/"+this.name+": Starting webserver functions for logTrigger");
	if(this.options.web===true || this.options.web) { //set default route
		this.options.web = "/logs";
	}
	this.winston.info(this.chatBot.name+"/"+this.name+': route: ',this.options.web);
	this.express = this._addRouter(this.options.web);
	this.express.use(function(req, res, next) {
		console.log("log request received;");
		next();
	});
	this.serverStarted = true;
	var that = this;
	this.index = serveIndex(that.options.logDir,{"icons":true,filter:function(f, i, fs, d){
		if (f.substring(0,that.options.prefix[0].length) === that.options.prefix[0]) {
			return false;
		} else {
			return true;
		}
	}});

	this.express.use(this.options.logURL, that.index);

	this.express.get(this.options.liveURL, function(req, res){
		that.winston.info(that.chatBot.name+"/"+that.name+": Logfile request by " + that.chatBot._getClientIp(req)); //don't define crap in two places...
		res.sendFile(__dirname+'/logTrigger/index.html');
	});

	this.express.use(this.options.logURL,express.static(that.options.logDir));
	this.express.use(that.options.liveURL+'/static',express.static(__dirname+'/logTrigger'));
	this.express.use('/static',express.static(__dirname+'/logTrigger'));

	this.server = this.chatBot.server;

	this.sockets = this._getSocket((that.options.web||"")+that.options.liveURL+".ws");
	var wsurl=this.options.wsURL ? "wsURL: "+this.options.wsURL : "";
	this.winston.info(this.chatBot.name+"/"+this.name+": websocket server created at "+this.options.liveURL+wsurl);
	this.sockets.on("connection", function(socket) {
		socket.ip = (socket.handshake.headers["x-forwarded-for"] || socket.handshake.address.address);
		that.winston.debug(that.chatBot.name+"/"+that.name+": websocket "+socket.id+"connected from +"+socket.ip);
		socket.emit('roomNames',that.options.roomNames);
		socket.emit('styles',that.getStyles());
		socket.on("options", function(data) {
			that.winston.info(that.chatBot.name+"/"+that.name+": options received");
			var linesToSend;
			if(data && data.lines) {
				if(data.lines < that.lineCount) {
					linesToSend = data.lines;
				} else {
					linesToSend = that.lineCount;
				}
			} else if (that.options.linesToSend < that.lineCount) {
				linesToSend = that.options.linesToSend;
			} else {
				linesToSend = that.lineCount;
			}
			console.log('linesToSend',linesToSend);
			var linesToSkip = that.lineCount - linesToSend-1; //not really sure why this is needed. I'm probably missing something.
			that.logs.global.stream({start: linesToSkip}).on("log", function(log){
	//			log.stream = true; //eventually I can do something about the bad ordering caused by people talking while this is still going on
				try {
					socket.emit('log',log);
				} catch(err){
					that.winston.error(that.chatBot.name+"/"+that.name+": Error:",err.stack);
				}
			});
			that.winston.debug(that.chatBot.name+"/"+that.name+": websocket connection open");
		});
	});
}

LogTrigger.prototype._padStr = function(i) {
	return (i < 10) ? "0" + i : "" + i;
}
LogTrigger.prototype._printDate = function() {
	var temp = new Date();
	var dateStr = this._padStr(temp.getHours()) +":"+ this._padStr(temp.getMinutes()) +":"+ this._padStr(temp.getSeconds());return (dateStr );
}
LogTrigger.prototype._sendSockets = function(log) {
	this.winston.silly(this.chatBot.name+"/"+this.name+": ",log);
	if(!this.sockets) {
		return false;
	}
	this.sockets.emit('log',log); //socket.io takes care of this logic.
}
LogTrigger.prototype.getStyles = function(){
	var that = this;
	var styles = {};
	try {
		var dir = __dirname+'/logTrigger/css/';
		var files = fs.readdirSync(dir);
		for(var i=0; i<files.length; i++) {
			if(files[i].indexOf(".css") > 0) {
				styles[files[i]] = fs.readFileSync(dir+files[i],'UTF8');
			}
		}
		styles["default"] = styles[that.options.defaultStyle];
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
	}
	return styles;
}
