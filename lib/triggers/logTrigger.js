var util = require('util');
var winston = require('winston');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var express = require("express");
/* Trigger that logs chat messages to files by groupchat "botname/logs/groupsteamid64.log". You NEED to put this trigger first, or it might not log everything. Removes blank lines

logDir        = string      - Defaults to './botname/logs'            - where to place the logfiles. Directory will be created if it doesn't exist. Set to '.' for current directory.
prefix        = [usr,grp]   - Defaults to ['u','g']                   - what to prefix the logfiles with. After this comes the defined 'name' (if defined; see next option) or steamid64, and then the suffix. Set to ["",""] to remove.
suffix        = [usr,grp]   - Defaults to ['.txt','.txt']             - what to append the log filename with. Set to ["",""] for nothing.
roomNames     = {}          - Defaults to {}                          - object containing group names by steamid64, to be used in filenames. {'steamid64':'GroupName','steamid64':'GroupName'}
logUserChats  = bool        - Defaults to true                        - log individual chats with users or no?
logGroupChats = bool        - Defaults to true                        - log individual group chats or no? Defaults to true.
logGlobal     = bool/String - Defaults to './botname/logs/global.txt' - log *all* chats to a global file as json? Set to 'false' to disable. Makes winston playback and other processing simple. file is still pretty easy to read
logConsole    = bool        - Defaults to true                        - Show logs in console?
serverPort    = string      - Defaults to 'false'                     - start a webserver on the specified port, if given, and serve logs from it, live, at /logs#gid where gid is a group's steamid (or leave out the hash for a log of all chat). Requires logGlobal enabled.
express       = Object      -                                         - If you're already running a webserver, pass the expressjs (or compatible) object in here. I have not tried this, I don't really know what I'm doing here. Don't expect it to work without tweaking the trigger.
rooms         = array       -                                         - universal trigger option. If you only want certain groups to be logged.
ignore        = array       -                                         - universal trigger option. If you want certain groups to *not* be logged.
*/

var LogTrigger = function() {
	LogTrigger.super_.apply(this, arguments);
};

util.inherits(LogTrigger, BaseTrigger);

var type = "LogTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new LogTrigger(type, name, chatBot, options);
	trigger.options.serverPort    = options.serverPort    || false;
	trigger.options.logDir        = options.logDir        || (process.cwd()+"/"+chatBot.username + '/logs');
	trigger.options.roomNames     = options.roomNames     || {};
	trigger.options.prefix        = options.prefix        || [ "u-" , "g-" ];
	trigger.options.suffix        = options.suffix        || [ ".txt" , ".txt" ];
	trigger.options.logUserChats  = options.logUserChats===false?false: true;
	trigger.options.logGlobal     = options.hasOwnProperty('logGlobal') && options.logGlobal!=true ? options.logGlobal : trigger.options.logDir+'/global.txt';
	trigger.options.logGroupChats = options.logGroupChats ===false?false:true;
	trigger.options.logConsole    = options.logConsole===false?false:true;
	trigger.respectsMute          = false;
	trigger.respectsFilters       = false;
	trigger.logs = {users:{},groups:{}};
	require('mkdirp').sync(trigger.options.logDir); //this should only need to be done once.
	return trigger;
};

LogTrigger.prototype._respondToFriendMessage = function(userId, message) {
	var that = this;
	if(that.options.logUserChats||that.options.logConsole) { // log user messages
		that.winston.debug("Logging message from "+userId);
		if(!(that.logs.users[userId] && that.logs.users[userId].log instanceof Function)) {
			var filename = that.options.logDir+'/'+that.options.prefix[0]+userId+that.options.suffix[0];
			that.winston.info("Initiating user log "+filename);
			that.logs.users[userId] = new winston.Logger;
			if(that.options.logUserChats) that.logs.users[userId].add(winston.transports.File, {colorize: false,timestamp: false,filename: filename,json:false});
			if(that.options.logConsole==false) that.logs.users[userId].remove(winston.transports.Console)
		}
		if(that.logs.users[userId].timeout) clearTimeout(that.logs.users[userId].timeout); //Remove a timeout if it exists. It will be reset.
		that.logs.users[userId].timeout = setTimeout(function(){delete that.users[userId]},300000); //remove the logger after 5 min. It will be re-added if necessary. Why keep them around for every user that only sends a single message?
		that.logs.users[userId].info(that._timestamp() + that._username(userId) + that._message(message),function(){that.winston.debug('logged user message');});
	}
	if(this.options.logGlobal) this._global(userId, userId, message);
	if(this.options.webServer!==false && !this.express) this._startServer();
	return false;
}
LogTrigger.prototype._respondToChatMessage = function(roomId, userId, message) {
	var that = this;
	if(this.options.logGroupChats==true||this.options.logConsole) {
		this.winston.debug("Logging message from "+userId+" in "+roomId);
		if(!(this.logs.groups[roomId] && this.logs.groups[roomId].log instanceof Function)) {
			var filename = that.options.logDir+'/'+that.options.prefix[1]+(that.options.roomNames[roomId]||roomId)+that.options.suffix[1];
			that.winston.info(roomId, "Initiating group log "+filename);
			that.logs.groups[roomId] = new winston.Logger;
			if(that.options.logGroupChats) that.logs.groups[roomId].add(winston.transports.File, {colorize: false,timestamp: false,filename: filename,json:false});
			if(that.options.logConsole==false) that.logs.groups[roomId].remove(winston.transports.Console);
		}
		this.logs.groups[roomId].info(this._timestamp() + this._username(userId) + this._message(message),function(){that.winston.debug("logged groupchat message")});
	};
	if(this.options.logGlobal) this._global(roomId, userId, message);
	if(this.webServer!==false && !this.express) this._startServer();
	return false;
}
LogTrigger.prototype._global = function(roomId, userId, message) {
	var that = this;
	var name = ((this.chatBot.steamClient.users && userId in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[userId].playerName) : steamId) + " ";
	this.winston.debug("Adding message from "+userId+(userId!=roomId?" for "+roomId:"")+" to global log: "+message);
	if(that.options.logGlobal && !(this.logs.global && this.logs.global.user instanceof Function)) {
		that.winston.info("Initializing global logfile");
		that.logs.global= new (winston.Logger)();
		that.logs.global.add(winston.transports.File,{filename:that.options.logGlobal,json:true,timestamp:false});
	}
	this.logs.global.info(message,{
		time:(new Date()-0),
		type:(userId==roomId?'user':'group'),
		user:userId,
		name:name,
		message:message
	},function(){that.winston.debug("logged to global log");});
//console.log(this.logs.global);
/*
	if(userId==roomId) this.logs.global.log('user',message,{
		time:(new Date()-0),
//		type:'user',
		user:userId,
		message:message
	},function(){console.log("logged to global log");});
	else this.logs.global.log('group',message,{
		time:(new Date()-0),
//		type:'group',
		group:roomId,
		user:userId,
		message:message
	},function(){console.log("logged to global log");});
*/
}
LogTrigger.prototype._username = function(steamId) {
	if(this.options.html==true)
		return '<a class="username" href="http://steamcommunity.com/profiles/'+steamId+'">'
			+ ((this.chatBot.steamClient.users && steamId in this.chatBot.steamClient.users) ? this.chatBot.steamClient.users[steamId].playerName : steamId)
			+ '</a> ';
	else return ((this.chatBot.steamClient.users && steamId in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[steamId].playerName + "/"+steamId) : steamId) + " ";
}
LogTrigger.prototype._message = function(message) {
	if(this.options.html==true)
		return String('<span class="message">'+message+'</span></p>').replace(/\n\n+/g,'\n');
	else return message.replace(/\n\n+/g,'\n');
}
String.prototype._pad = function (length, character) {
	return new Array(length - this.length + 1).join(character || ' ') + this;
}
LogTrigger.prototype._timestamp = function() {
	var date = new Date();
	var string = String(date.getHours())._pad(2,'0') + ":"
                   + String(date.getMinutes())._pad(2,'0') + ":"
                   + String(date.getSeconds())._pad(2,'0');
	if(this.options.html==true) return '<p><span class="timestamp">'+string+'</span> ';
	else return string+' ';
}

LogTrigger.prototype._startServer = function(){
	var that = this;
	this.express = this.options.express||express();
	this.express.get("/", function(req, res) {
		that.winston.info('Logfile request : ' + JSON.stringify(req.params));
		res.sendFile( __dirname + req.params[0]); 
	});

	this.express.WebSocketServer = require("ws").Server
	this.expresshttp = this.expresshttp||require("http");

	this.express.get('/log', function(req, res){
		that.winston.info('Logfile request : ' + JSON.stringify(req.params));
		res.send("<html><head><style>body {font-family: \"Helvetica Neue\", helvetica, arial;padding: 15px;}\nul {list-style: none;margin: 0;padding: 0;}\nul li {line-height: 1.4;font-size:12pt;}\n.prefix {font-size:8px;}</style><script>\nString.prototype._pad = function (length, character) {\nreturn new Array(length - this.length + 1).join(character || ' ') + this;\n}\nvar months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];\nvar formatDate = function(timestamp) {\nvar date = new Date(timestamp);\nvar string = String(months[date.getMonth()])+' '\n                   + String(date.getDate())+' '\n                   + String(date.getHours())._pad(2,'0') + ':'\n                   + String(date.getMinutes())._pad(2,'0') + ':'\n                   + String(date.getSeconds())._pad(2,'0');\nif(this.options.html==true) return '<p><span class=\"timestamp\">'+string+'</span> ';\nelse return string+' ';\n}\nvar nib;\nvar format = function(data){\n	return \"<span class='prefix'>\"+data.roomId+\"</span>&nbsp;<span class='time'>\"+formatDate(data.time)+\"</span>&nbsp;&lt;<a href='http://steamcommunity.com/profiles/\"+data.steamId+\"'>\"+data.user+\"</a>&gt;&nbsp;&nbsp;\"+data.message;}\nvar host = location.origin.replace(/^http/, 'ws')\nvar ws = new WebSocket(host);\nws.onmessage = function (event) {\n	nib=event;\n	if(!window.location.hash || window.location.hash=='#'+JSON.parse(event.data).roomId) {\n		var li = document.createElement('li');\n		li.innerHTML = format(JSON.parse(event.data));\n		document.querySelector('#pings').appendChild(li);\n	};\n}</script></head><body><h1 id='title'>Log</h1><ul id='pings'></ul></body></html>");
	});

	this.server = this.expresshttp.createServer(this.express);
	if(!this.options.express) this.server.listen(that.options.serverPort, function() {
		that.winston.info("Listening on " + that.options.serverPort);
	});

	this.wss = new WebSocketServer({server: that.server})
	this.winston.info("websocket server created")
	this.wss.connections = {name: "value"};
	this.wss.connum =1;
	this.wss.on("connection", function(ws) {
		that.wss.connections[that.wss.connum]=that.ws;
		that.logs.global.stream({start: -1}).on('log', function(log){
			that._sendSocket(log);
		});
		setTimeout(function(){that.ws.send('sucessful open');},1000);
		that.winston.info("websocket connection open")

		that.ws.on("close", function() {
			delete that.wss.connections[that.wss.connum];
			that.winston.info("websocket connection close")
			clearInterval(that.wss.connum)
		})
		that.wss.connum++;
	});
}

LogTrigger.prototype._padStr = function(i) {
	return (i < 10) ? "0" + i : "" + i;
}
LogTrigger.prototype._printDate = function() {
	var temp = new Date();
	var dateStr = this._padStr(temp.getHours()) +":"+ this._padStr(temp.getMinutes()) +":"+ this._padStr(temp.getSeconds());return (dateStr );
}
LogTrigger.prototype._sendSocket = function(log) {
	var that = this;
	Object.keys(this.wss.connections).forEach(function(key){
		if(key!="name") { try{
			that.wss.connections[key].send(JSON.stringify(log));
		} catch(err){that.winston.error(err); delete that.wss.connections[key];} }
	});
}
