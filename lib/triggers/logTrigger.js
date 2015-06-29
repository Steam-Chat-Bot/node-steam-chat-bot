var util = require("util");
var winston = require("winston");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var express = require("express");
var handySanitizer = require("sanitize-filename");
var serveIndex = require("serve-index");
var url = require("url");
/* Trigger that logs chat messages to files by groupchat "botname/logs/groupsteamid64.log". You NEED to put this trigger first, or it might not log everything. Removes blank lines

logDir        = string    - "./botname/logs"            - where to place the logfiles. Directory will be created if it doesn't exist. Set to "." for current directory.
prefix        = [usr,grp] - ["u","g"]                   - what to prefix the logfiles with. After this comes the defined "name" (if defined; see next option) or steamid64, and then the suffix. Set to ["",""] to remove.
suffix        = [usr,grp] - [".txt",".txt"]             - what to append the log filename with. Set to ["",""] for nothing.
roomNames     = {}        - {}                          - object containing group names by steamid64, to be used in filenames. {"steamid64":"GroupName","steamid64":"GroupName"}
logUserChats  = bool      - true                        - log individual chats with users or no?
logGroupChats = bool      - true                        - log individual group chats or no? Defaults to true.
logGlobal     = bool/Str  - "./botname/logs/global.txt" - log *all* chats to a global file as json? Set to "false" to disable. Makes winston playback and other processing simple. file is still pretty easy to read
logConsole    = bool      - true                        - Show logs in console?
linesToSend   = int       - 500                         - How many lines of history to send to the webserver? Can be overriden with ?lc=
web           = bool      - true                        - Should we enable the webserver portion? Live logs and logfiles.
liveURL       = string    - "/live"                     - where do you want to serve the "live" log (stuff shows up as it happens)
logURL        = string    - "/logs"                     - where do you want to serve the logfiles (static .txt files)
rooms         = array     -                             - universal trigger option. If you only want certain groups to be logged.
ignore        = array     -                             - universal trigger option. If you want certain groups to *not* be logged.
pingTimer     = int       - 5000                        - How often should the server ping the client? I have set the ping default to 5s instead, and am now using the built-in ping packet instead of my own packet. Supposedly this shouldn't be needed if your server is set up right, but I'm getting reports of people being disconnected.
wsURL         = string    - false                       - If this doesn't work because of a proxy or some such, set the public/visible url of your server here. Use ws:// for http and ws:// for https. Set to false to not use a different url for websocket (default).
*/

var LogTrigger = function() {
	LogTrigger.super_.apply(this, arguments);
//	setTimeout(this._onLoad.bind(this));
};

util.inherits(LogTrigger, BaseTrigger);

var type = "LogTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new LogTrigger(type, name, chatBot, options);
	trigger.options.web           = options.web           || true;
	trigger.options.pingTimer     = options.pingTimer     || 5000;
	trigger.options.liveURL       = options.liveURL       || "/live";
	trigger.options.logURL        = options.logURL        || "/logs";
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
	if(this.chatBot.steamClient.users && toId in this.chatBot.steamClient.users) {
		this._respondToFriendMessage(this.chatBot.steamClient.steamId, "to: "+toId+"; message: "+message);
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
				that.logs.users[userId].remove(winston.transports.Console)
			}
		}
		if(that.logs.users[userId].timeout) {
			clearTimeout(that.logs.users[userId].timeout); //Remove a timeout if it exists. It will be reset.
		}
		that.logs.users[userId].timeout = setTimeout(function(){delete that.logs.users[userId]},300000); //remove the logger after 5 min. It will be re-added if necessary. Why keep them around for every user that only sends a single message?
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
			that.winston.debug(that.chatBot.name+"/"+that.name+": logged groupchat message")
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
		displayName:((that.chatBot.steamClient.users && userId in that.chatBot.steamClient.users) ? (that.chatBot.steamClient.users[userId].playerName) : userId) + "",
		actedName:(actedId === null ? null : ((that.chatBot.steamClient.users && actedId in that.chatBot.steamClient.users) ? (that.chatBot.steamClient.users[actedId].playerName) : actedId) + ""),
		message:message
	}
	this.logs.global.info(message,log,function(){
		that.winston.debug(that.chatBot.name+"/"+that.name+": logged to global log");
	});
	that._sendSockets(log);
}
LogTrigger.prototype._username = function(steamId) {
	if(this.options.html === true) {
		return '<a class="username" href="http://steamcommunity.com/profiles/'+steamId+'">'
			+ ((this.chatBot.steamClient.users && steamId in this.chatBot.steamClient.users) ? this.chatBot.steamClient.users[steamId].playerName : steamId)
			+ '</a> ';
	} else {
		return ((this.chatBot.steamClient.users && steamId in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[steamId].playerName + "/"+steamId) : steamId) + " ";
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
	this.serverStarted = true;
	var that = this;
	this.express = this.chatBot.router;
	this.index = serveIndex(that.options.logDir,{"icons":true,filter:function(f, i, fs, d){
		if (f.substring(0,that.options.prefix[0].length) === that.options.prefix[0]) {
			return false;
		} else {
			return true;
		}
	}});

	this.express.use(this.options.logURL, that.index);

	var WebSocketServer = require("ws").Server

	this.express.get(this.options.liveURL, function(req, res){
		that.winston.info(that.chatBot.name+"/"+that.name+": Logfile request by " + that.chatBot._getClientIp(req)); //don't define crap in two places...
		var linesToSkip = that.lineCount - (req.query.lc?(req.query.lc<that.lineCount ? req.query.lc : that.lineCount) : (that.options.linesToSend<that.lineCount ? that.options.linesToSend : that.lineCount));
		var formats = {
			nohighlight: ".time{\n\t\t\t\ttext-indent:0;\n\t\t\t}\n\t\t\t#title a{\n\t\t\t\ttext-decoration:none;\n\t\t\t\tcolor:#0588BC;\n\t\t\t}\n\t\t\ta.userid{\n\t\t\t\ttext-decoration:none;\n\t\t\t\tcolor:#298F00;\n\t\t\t}\n\t\t\tol{\n\t\t\t\tlist-style:none;\n\t\t\t\tmargin:0;\n\t\t\t\tpadding:0;\n\t\t\t}\n\t\t\t\n\t\t\t.time{\n\t\t\t\tdisplay:none;\n\t\t\t}\n\t\t\tli:hover .time, .line:focus .time{\n\t\t\t\tdisplay: inline;\n\t\t\t\tfloat: right;\n\t\t\t}\n\t\t\t",
			standard: ".time{\n\t\t\t\ttext-indent:0;\n\t\t\t}\n\t\t\t#title a{\n\t\t\t\ttext-decoration:none;\n\t\t\t\tcolor:#0588BC;\n\t\t\t}\n\t\t\ta.userid{\n\t\t\t\ttext-decoration:none;\n\t\t\t\tcolor:#298F00;\n\t\t\t}\n\t\t\tol{\n\t\t\t\tlist-style:none;\n\t\t\t\tmargin:0;\n\t\t\t\tpadding:0;\n\t\t\t}\n\t\t\t\n\t\t\t.time{\n\t\t\t\tdisplay:none;\n\t\t\t}\n\t\t\tli:hover .time, li:focus .time{\n\t\t\t\tdisplay: inline;\n\t\t\t\tfloat: right;\n\t\t\t}\n\t\t\tol li:hover, ol li:focus{\n\t\t\t\tbackground:#EEE;\n\t\t\t\ttext-indent:initial;\n\t\t\t\tmargin-left:initial;\n\t\t\t}\n\t\t\t",
			debug: "",
			plain: ""
		}
		var format = req.query.format in formats ? formats[req.query.format] : formats.standard;
		if(req.query.room) {
			format+=".roomId{\n\t\t\t\tdisplay:none;\n\t\t\t}\n\t\t\t";
		}
		var css = "<style>\n\t\t\tbody{\n\t\t\t\tfont-family:\"HelveticaNeue\",helvetica,arial;\n\t\t\t\tpadding:15px;\n\t\t\t}\n\t\t\t"+format+"ol li{\n\t\t\t\tline-height:1.4;\n\t\t\t\tfont-size:12pt;\n\t\t\t\ttext-indent:-100px;\n\t\t\t\tmargin-left:100px\n\t\t\t}\n\t\t\t.roomid{\n\t\t\t\tfont-size:9pt;\n\t\t\t}\n\t\t\t.join, .left, .kick, .disconnect, .ban {\n\t\t\t\tfont-style: italic;\n\t\t\t}\n\t\t</style>";
		var scripts = "<script src='//cdn.rawgit.com/gregjacobs/Autolinker.js/master/dist/Autolinker.min.js'></script>\n\t\t<script>\n\t\t\tvar getQuery = function() { \/\/why can't I remember where I stole this from?\n\t\t\t\tvar query = {};\n\t\t\t\tvar params = window.location.search.substring(1).split(\"&\");\n\t\t\t\tfor (var i=0;i<params.length;i++) {\n\t\t\t\t\tvar pair = params[i].split(\"=\");\n\t\t\t\t\tquery[pair[0]] = pair.splice(1).join('=');\n\t\t\t\t}\n\t\t\t\treturn query;\n\t\t\t}\n\t\t\tvar escape=document.createElement('textarea');\n\t\t\tvar escapetext = function(html){\n\t\t\t\tescape.innerHTML=html;\n\t\t\t\treturn escape.innerHTML;\n\t\t\t}\n\t\t\tString.prototype._pad=function(length,character){\n\t\t\t\treturn new Array(length - this.length + 1).join(character || ' ') + this;\n\t\t\t}\n\t\t\tvar months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];\n\t\t\tvar formatDate=function(timestamp){\n\t\t\t\tvar date=new Date(timestamp);\n\t\t\t\treturn String(months[date.getMonth()])+' '\n\t\t\t\t+ String(date.getDate())+' '\n\t\t\t\t+String(date.getHours())._pad(2,'0') + ':'\n\t\t\t\t+ String(date.getMinutes())._pad(2,'0') + ':'\n\t\t\t\t+ String(date.getSeconds())._pad(2,'0') + '';\n\t\t\t}\n\t\t\tvar nib;\n\t\t\tvar format=function(data){"+(that.options.logLevel && that.options.logLevel!=="info"?"\n\t\t\t\tconsole.log(data);":"")+"\n\t\t\t\tif(data.type === \"ban\"||data.type === \"kick\") data.message+=\" by <a href='http://steamcommunity.com/profiles/\"+data.actedId+\"'>\"+data.actedName+\"</a>\";\n\t\t\t\treturn (data.roomId ? (\"<span class='roomid'><a href='http://steamcommunity.com/gid/\"+data.roomId+\"'>\"+(typeof roomNames === 'undefined' ? data.roomId :(roomNames[data.roomId]||data.roomId))+\"</a>&nbsp;</span>\"):\"\")+\"<span class='time'>\"+formatDate(data.time)+\"&nbsp;</span>\"\n\t\t\t\t+(data.type === 'user'||data.type === 'group' ? \"&lt;\" : \"\")+\"<span class='userid'><a href='http://steamcommunity.com/profiles/\"+data.userId+\"' class='userid'>\"+escapetext(data.displayName)+\"</a>\"+(data.type === 'user'||data.type === 'group' ? \"&gt;\" : \"\")+\"&nbsp;</span>\"\n\t\t\t+\"<span class='\"+data.type+\"'>\"+((data.type!==\"ban\"&&data.type!==\"kick\")?escapetext(data.message):data.message).replace(/\\n/g,'<br>');+\"</span>\";\n\t\t\t}\n\t\t\tvar host="+(that.options.wsURL?"'"+that.options.wsURL+'"':"location.href.replace('http','ws')")+";\n\t\t\tvar ws=new WebSocket(host);\n\t\t\tws.onmessage=function(event){\n\t\t\t\tnib=event;"+(that.options.logLevel && that.options.logLevel!=="info"?"\n\t\t\t\tconsole.log(data);":"")+"\n\t\t\t\tif(JSON.parse(event.data).roomId===null) return;\n\t\t\t\tif(JSON.parse(event.data).type === 'roomNames')roomNames=JSON.parse(event.data).names\n\t\t\t\telse if(!window.location.hash ||window.location.hash === '#'+JSON.parse(event.data).roomId){\n\t\t\t\t\tvar li=document.createElement('li');\n\t\t\t\t\tli.innerHTML=(Autolinker?Autolinker.link(format(JSON.parse(event.data))):format(JSON.parse(event.data)));\n\t\t\t\t\tdocument.querySelector('#pings').appendChild(li);window.scrollTo(0,document.body.scrollHeight);\n\t\t\t\t};\n\t\t\t}\n\t\t\tws.onclose=function(){\r\n\t\t\t\tvar li=document.createElement('li');\r\n\t\t\t\tli.innerHTML='<li><a class=\"roomid\"></a>&nbsp;<span class=\"time\">'+formatDate((new Date()-0))+'</span>&nbsp;<span href=\"http://steamcommunity.com/profiles/76561198141357312\" class=\"disconnected\">You have been disconnected from the server!</span></li>';\r\n\t\t\t\tdocument.querySelector('#pings').appendChild(li);window.scrollTo(0,document.body.scrollHeight);\r\n\t\t\t};\r\n\t\t\tws.onerror=function(){\r\n\t\t\t\tvar li=document.createElement('li');\r\n\t\t\t\tli.innerHTML='<li><a class=\"roomid\"></a>&nbsp;<span class=\"time\">'+formatDate((new Date()-0))+'</span>&nbsp;<span href=\"http://steamcommunity.com/profiles/76561198141357312\" class=\"disconnected\">You have been disconnected from the server!</span></li>';\r\n\t\t\t\tdocument.querySelector('#pings').appendChild(li);window.scrollTo(0,document.body.scrollHeight);\r\n\t\t\t};\n\t\t\t</script>";
		var head = "<head>\n\t\t"+css+"\n\t\t"+scripts+"\n\t</head>";
		var body = "<body>\n\t\t<h1 id='title'>Log: "+(req.query.lc?req.query.lc+" lines ":"")+(req.query.room?"from <a href=\"http://steamcommunity.com/gid/"+req.query.room+"\">"+((req.query.room in that.options.roomNames) ? that.options.roomNames[req.query.room]:req.query.room):"")+"</a></h1>\n\t\t<ol id='pings' start='"+linesToSkip+"'>\n\t\t</ul>\n\t</body>";
		res.send("<html>\n\t"+head+"\n\t"+body+"\n</html>");
	});

	this.express.use(this.options.logURL,express.static(that.options.logDir));

	this.server = this.chatBot.server;

	this.wss = new WebSocketServer({server: that.server, path:that.options.liveURL})
	wsurl=this.options.wsURL ? "wsURL: "+this.options.wsURL : "";
	this.winston.info(this.chatBot.name+"/"+this.name+": websocket server created at "+this.options.liveURL+wsurl)
	this.wss.connections = {};
	this.wss.connum =0;
	this.wss.on("connection", function(ws) {
		ws.send('open');
		ws.id = (that.wss.connum++).toString();
		ws.ip = (ws.upgradeReq.headers["x-forwarded-for"] || ws.upgradeReq.connection.remoteAddress);
		that.winston.debug(that.chatBot.name+"/"+that.name+": websocket "+ws.id+"connected from +"+ws.ip);
		var query = url.parse(ws.upgradeReq.url,true,true).query;
		var linesToSend = (query && query.lc ? (query.lc<that.lineCount ? query.lc : that.lineCount) : (that.options.linesToSend<that.lineCount ? that.options.linesToSend : that.lineCount));
		that.wss.connections[ws.id]=ws;
		ws.send(JSON.stringify({type:"roomNames",names:that.options.roomNames}));
		var linesToSkip = that.lineCount - linesToSend-1; //not really sure why this is needed. I'm probably missing something.
		that.logs.global.stream({start: linesToSkip}).on("log", function(log){
//			log.stream = true; //eventually I can do something about the bad ordering caused by people talking while this is still going on
			if(!query.room || query.room === log.roomId) {
				try {
					ws.send(JSON.stringify(log));
				} catch(err){
					that.winston.error(this.chatBot.name+"/"+this.name+": Error:");
					that.winston.error(err.stack)
				}
			}
		});
		that.winston.debug(that.chatBot.name+"/"+that.name+": websocket connection open")

		ws.on("close", function() {
			that.winston.debug(that.chatBot.name+"/"+that.name+": websocket connection error "+ws.id+" from "+ws.ip+" closed");
			if(ws.pingTimer) {
				that.winston.silly(that.chatBot.name+"/"+that.name+": Clearing websocket pinger for "+ws.id+" from "+ws.ip);
				clearInterval(ws.pingTimer);
			}
			delete that.wss.connections[ws.id];
		});
		ws.on("error", function() {
			that.winston.debug(that.chatBot.name+"/"+that.name+": websocket connection error for "+ws.id+" from "+ws.ip+". probably just someone closing the page. on('close') doesn't work right. BOO.");
			if(ws.pingTimer) {
				that.winston.silly(that.chatBot.name+"/"+that.name+": Clearing websocket pinger for "+ws.id+" from "+ws.ip);
				clearInterval(ws.pingTimer);
			}
			delete that.wss.connections[ws.id];
		});
		ws.on("ping", function(data, flags){
			ws.pong({type:'pong',time:new Date()-0});
			that.winston.silly(that.chatBot.name+"/"+that.name+": websocket ping received from websocket "+ws.id+" from "+ws.ip);
		});
		ws.on("pong", function(data, flags){
			that.winston.silly(that.chatBot.name+"/"+that.name+": websocket pong received from websocket "+ws.id+" from "+ws.ip);
		});
		ws.pingTimer = setInterval(function(){
			that.winston.silly(that.chatBot.name+"/"+that.name+": pinging websocket "+ws.id+" from "+ws.ip);
			try {
				ws.ping({type:"ping",time:+(new Date()-0)});
			} catch(err) {
				that.winston.error(that.chatBot.name+"/"+that.name,err.stack);
				clearInterval(ws.pingTimer);
			}
		}, that.options.pingTimer);
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
	var that = this;
	that.winston.silly(that.chatBot.name+"/"+that.name+": ",log);
	if(that && that.wss && that.wss.connections) {
		Object.keys(that.wss.connections).forEach(function(key){
			try{
				var ws = that.wss.connections[key];
				var query = url.parse(ws.upgradeReq.url,true,true).query;
				if(!query.room || query.room === log.roomId) {
					ws.send(JSON.stringify(log));
				}
			} catch(err){
				that.winston.error(this.chatBot.name+"/"+this.name);
				that.winston.error(err.stack);
				if(ws.pingTimer) {
					clearInterval(ws.pingTimer);
				}
				delete that.wss.connections[key];
			}
		});
	}
}
