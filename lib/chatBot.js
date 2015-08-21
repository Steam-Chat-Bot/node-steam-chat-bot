var ver = "2.2.0-dev"; //update this before pushing to master.

var fs = require("fs");
var steam = require("steam");
var winston = require("winston");
var _ = require("lodash");
var SteamTrade = require('steam-trade');
var http = require("http");
var Express = require('express');
var expressWinston = require('express-winston');
var TriggerFactory = require("./triggerFactory.js").TriggerFactory;
var qs = require('qs');
var crypto = require('crypto');
var SteamWebLogon = require('steam-weblogon');
var GetSteamApiKey = require('steam-web-api-key');
var GetInterface = require('steam-web-api');
//keep track of crap that's loaded later
//var repo = require('gift')('.');
//var git = require('git-rev-sync');
//var io = require('socket.io');
var serversFile = "servers";

// Load latest servers from file
if (fs.existsSync(serversFile)) {
	try {
		winston.silly("Attempting to read servers file");
		steam.servers = JSON.parse(fs.readFileSync(serversFile));
	} catch(err) {
		winston.error("Error reading serversFile:");
		winston.error(err.stack);
	}
} else {
	winston.warn("No servers file found, using defaults");
}

var wcfg = { //define some extra logLevels for winston, also colors
	levels: {
		spam: 0,
		protocol: 1,
		silly: 2,
		verbose: 3,
		info: 4,
		data: 5,
		warn: 6,
		debug: 7,
		error: 8,
		failure: 9
	},
	colors: {
		spam:'bold',
		protocol:'grey',
		silly:'white',
		verbose:'cyan',
		info:'green',
		data:'gray',
		warn:'yellow',
		debug:'blue',
		error:'red',
		failure:'rainbow'
	}
}

// Bot should be usually created without options, it is a parameter mainly for testing
var ChatBot = function(username, password, options) {
	var that = this;

	require('gift')('.').status(function(err,status){
		if(err || ver.indexOf("dev")===-1) {
			that.version = ver;
		} else {
			var git = require('git-rev-sync');
			that.version  = ver.replace('-dev','-git ');
			that.version += git.branch()+"/"+git.short();
			if(!status.clean) that.version+="+";
		}
	});
	if(username instanceof Object) {
		options = username;
		if(options.username) username = options.username;
		if(options.password) password = options.password;
	}
	this.options = options || {};
	this.winston = new (winston.Logger)({levels:wcfg.levels, colors: options.winstonColors||wcfg.colors});

	this.steamClient = options.client || new steam.SteamClient();
	this.steamUser = options.user || new steam.SteamUser(this.steamClient);
	this.steamFriends = options.friends || new steam.SteamFriends(this.steamClient);
	this.steamTrading = options.trading || new steam.SteamTrading(this.steamClient);
	this.steamWebLogon = new SteamWebLogon(this.steamClient, this.steamUser);
	this.steamTrade = new SteamTrade();
	this.name = options.name || username;
	this.username = username;
	this.password = password;
	if(options.guardCode) {
		this.guardCode = options.guardCode;
	} else {
		this.guardCode = false;
	}
	this.apikey = options.steamapikey || undefined;
	this.sentryFile = undefined;
	this.games = [];
	this.logFile = undefined;
	this.cookie = undefined;
	this.ignores = options.ignores || [];
	this.startTime = process.hrtime();
	this.logoffTime = process.hrtime();
	this.autojoinRooms = undefined;

	if(!fs.existsSync(this.name)) { fs.mkdirSync(this.name); }

	this.autojoinFile = options.autojoinFile || this.getOrMove("bot." + this.name+".autojoin");

	this.winston.add(winston.transports.Console,{
		handleExceptions: false,
		colorize: options.consoleColors||true,
		timestamp: options.consoleTime||true,
		level: options.consoleLogLevel||"info",
		json: false
	});

	if(!options.logFile || options.logFile !== false || options.logFile === null || options.logFile === undefined)  {
		if(options.logFile === true || !options.logFile) {
			that.logFile = that.getOrMove("bot." + that.name + ".log");
		} else {
			that.logFile = options.logFile;
		}
		that.winston.info("Chatbot "+that.name+" logging output to: " + that.logFile);
		that.winston.add(
			winston.transports.File, {
				level: options.logLevel || "info",
				colorize:false,
				timestamp:true,
				filename:that.logFile,
				json:false
			}
		);
	}

	if(options.sentryFile) {
		this.sentryFile = options.sentryFile;
		if(fs.existsSync(options.sentryFile)) {
			this.winston.info("Chatbot "+that.name+" using sentryfile as defined by options: "+options.sentryfile);
		} else {
			this.winston.warn("Chatbot "+that.name+": Sentry file defined in config does not exist. "
				+ options.sentryFile + " will be created on successful login");
		}
	} else {
		this.winston.info("Chatbot "+that.name+": Config file does not define a sentryfile. Attempting to autodetect sentry...");
		var sentryFile = _.find([
			"sentry."+this.name+".hash",
			"sentry."+this.name,
			"sentryfile."+this.name,
			"sentryfile."+this.name+".hash",
			"bot."+this.name+".hash",
			"bot."+this.name+".sentry",
			this.name+".hash",
			this.name+".sentry"
		], function(val) {
			if(fs.existsSync(val)) {
				return that.getOrMove(val);
			}
			if(fs.existsSync(that.name+"/"+val)) {
				return that.name+"/"+val;
			}
		});
		if ("undefined" !== typeof sentryFile) {
			this.sentryFile = sentryFile;
			this.winston.info("Chatbot "+that.name+": Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync("sentry")) {
			this.sentryFile = "sentry";
			this.winston.warn("Chatbot "+that.name+": Sentry file sentry detected, but it may be incorrect as it does not claim a username. If correct, please rename to bot."
				+ this.name + ".sentry or another supported sentry filename, or rename and define file name in config.");
		} else {
			this.sentryFile = this.name+"/"+"bot."+this.name+".sentry";
			this.winston.warn("Chatbot "+that.name+": Could not detect a sentryfile, and no guardCode defined. Using default sentryFile "
				+ this.sentryFile + ". I hope you have a guardCode defined or steamguard disabled. ");
		}
	}

	this.connected = false; // Bot is connected to the steam network
	this.muted = false; // Should not send any messages to a chat room when muted

	this.winston.silly("Starting webserver");
	if(!options.disableWebserver) {
		this._startWebServer(options.webServerPort||8080)
	}
	this.winston.silly("Starting triggerFactory");
	this.triggers = {};
	if (options.triggerFactory) {
		this.triggerFactory = options.triggerFactory;
	} else {
		this.triggerFactory = new TriggerFactory();
	}

	this.unmutedState = steam.EPersonaState.Online;
	this.mutedState = steam.EPersonaState.Snooze;

	if(options.onLogon instanceof Function) {
		this.onLogon = options.onLogon;
	}

	//Steam-client events
	this.steamClient.on("error",                    function()                 { that._onError(); });
	this.steamClient.on("logOnResponse",            function(res)              { that._onLogOnResponse(res); that.onLogon(that); that.triggerLoggedOn(); });
	this.steamClient.on("loggedOff",                function(eresult)          { that._onDisconnected(eresult); that.triggerLoggedOff(); });
	this.steamClient.on('connected',                function()                 { that._onConnected(); });
	this.steamClient.on('message',                  function(header, body, cb) { that._onMessage(header, body, cb) });

	//Steam-user events
	this.steamUser.on("updateMachineAuth",          function(sentry, cb)       { that._onUpdateMachineAuth(sentry, cb); })
	this.steamUser.on('tradeOffers',                function(number)           { that._onTradeOffers(number); });

	//Steam-friends events
	this.steamFriends.on("chatInvite",              function(roomId, roomName, inviterId)      { that._onChatInvite(roomId, roomName, inviterId); });
	this.steamFriends.on("friend",                  function(userId, relationship)             { that._onRelationship(userId, relationship); });
	this.steamFriends.on("friendMsg",               function(userId, message, type)            { that._onFriendMsg(userId, message, type); });
	this.steamFriends.on("chatMsg",                 function(roomId, message, type, chatterId) { that._onChatMsg(roomId, message, type, chatterId); });
	this.steamFriends.on("chatStateChange",         function(stateChange, chatterActedOn, steamChatId, actedOnBy) { that._onChatStateChange(stateChange, chatterActedOn, steamChatId, actedOnBy); });
	//this.steamFriends.on('clanState',             function(res) { that._onClanState(res); });

	//Steam-trading events
	this.steamTrading.on('tradeProposed',           function(tradeID, steamID)         { that._onTradeProposed(tradeID, steamID, that.acceptTrade); });
	this.steamTrading.on('tradeResult',             function(tradeID, result, steamID) { that._onTradeResult(tradeID, result, steamID) });
	this.steamTrading.on('sessionStart',            function(steamID)                  { that._onSessionStart(steamID) });

	//This was removed in node-steam 1.0.0, using module node-steam-weblogon by Alex7Kom instead
	//this.steamClient.on('webSessionID',           function(sessionID) { that._onWebSessionID(sessionID); });

	//This was replaced in node-steam 1.0.0 with 'clanState', which is handled above in steam-friends
	//this.steamClient.on('announcement',           function(groupID, headline) { that._onAnnouncement(groupID, headline); });
/*
// These events exist in node-steam, but are only half-implemented in this file...
	this.steamClient.on("user", function(obscureData)              {that._onUser(obscureData); });
	this.steamClient.on("group", function(group, clanRelationship) {that._onGroup(group, clanRelationship); });
	this.steamClient.on("richPresence", function(steamId,status,obscureData) {that._onRichPresence(steamId,status,obscureData); });
*/

	// Store latest servers
	this.steamClient.on("servers", function(servers) {
		try{
			that.winston.silly("Chatbot "+that.name+": Attempting to write servers file");
			fs.writeFileSync(serversFile, JSON.stringify(servers));
		} catch(err) {
			that.winston.error("Chatbot "+that.name+": Error writing servers file:");
			that.winston.error(err.stack);
		}
	});

	if (options.autoConnect) {
		this.connect();
	}
};


// Public interface
ChatBot.prototype.onLogon = function(bot) {
	return;
}


ChatBot.prototype.logOn = function() {
	// Continuously try to reconnect if started but not connected
	// If someone logs in as the bot it will be disconnected, so this allows the bot to recover automatically when it can
	if (this.options.autoReconnect && !this.babysitInterval) {
		var babysitTimer = this.options.babysitTimer || 5*60*1000;
		var that = this;
		this.babysitInterval = setInterval(function() { that.logOn(); }, babysitTimer);
	}

	if (!this.connected) {
		this.winston.info("Chatbot "+this.name+": Trying to connect");
		try {
			var sha = '';
			if(fs.existsSync(this.sentryFile)) {
				var file = fs.readFileSync(this.sentryFile);
				sha = crypto
					.createHash('sha1')
					.update(file)
					.digest();
			}
			if(this.guardCode) {
				this.steamUser.logOn({
					account_name: this.username,
					password: this.password,
					auth_code: this.guardCode,
					sha_sentryfile: (fs.existsSync(this.sentryFile) ? sha : undefined)
				});
			} else {
				this.steamUser.logOn({
					account_name: this.username,
					password: this.password,
					sha_sentryfile: (fs.existsSync(this.sentryFile) ? sha : undefined)
				});
			}
		} catch (err) {
			this.winston.error("Chatbot "+this.name+": Exception trying to connect", err);
		}
	}
}

ChatBot.prototype.connect = function() {
	this.steamClient.connect();
	this.winston.debug('Connecting to Steam network...');
}

ChatBot.prototype.log = function(){};

ChatBot.prototype.mute = function() {
	this.muted = true;
	this._updatePersonaState();
}

ChatBot.prototype.unmute = function() {
	this.muted = false;
	this._updatePersonaState();
}

// Run the .onLoggedOff function for each trigger
ChatBot.prototype.triggerLoggedOff = function() {
	if(!this.triggers || this.triggers.length === 0) {
		return;
	}
	var that = this;
	this.logoffTime = process.hrtime();
	_.each(this.triggers, function(trigger) {
		try {
			that.winston.debug("Chatbot "+that.name+": Running onLoggedOff for " + trigger.type + " trigger " + trigger.name);
			trigger.onLoggedOff();
			return null;
		} catch(err) {
			that.winston.error("Chatbot "+that.name+": Error running onLoggedOff for " + trigger.type + " trigger " + trigger.name);
			that.winston.error(err.stack);
		}
	});
	return null;
}

// Run the .onLoggedOn function for each trigger
ChatBot.prototype.triggerLoggedOn = function() {
	if(!this.triggers || this.triggers.length === 0) {
		return;
	}
	this.logonTime = process.hrtime();
	var that = this;
	_.each(this.triggers, function(trigger) {
		try {
			that.winston.debug("Chatbot "+that.name+": Running onLoggedOn for " + trigger.type + " trigger " + trigger.name);
			trigger.onLoggedOn();
			return null;
		} catch(err) {
			that.winston.error("Chatbot "+that.name+": Error running onLoggedOn for " + trigger.type + " trigger " + trigger.name);
			that.winston.error(err.stack);
		}
	});
	return null;
}

// Add or replace a trigger - return the trigger or null
ChatBot.prototype.addTrigger = function(name, type, options) {
	if (!name || !type) {
		return false;
	}

	this.removeTrigger(name);

	var trigger = this.triggerFactory.createTrigger(type, name, this, options || {}, true);

	try {
		this.winston.debug("Chatbot "+this.name+": Testing onLoad for " + type + " trigger " + name);
		if (trigger && (!trigger.onLoad || trigger._onLoad())) {
			this.winston.silly("Chatbot "+this.name+": onLoad success for " + type + " trigger " + name);
			this.triggers[name] = trigger;
			return trigger;
		} else if (trigger) {
			this.winston.error("Chatbot "+this.name+": Error loading " + type + " trigger " + name);
			return null;
		}
	} catch(err) {
		this.winston.error("Chatbot "+this.name+": Error loading " + type + " trigger " + name + ":");
		this.winston.error(err.stack);
	}
	return null;
}

// Any duplicate names will be replaced
// triggers is of the form [{name:"",type:"",options:{}}, {name:"",type:"",options:{}}, etc]
// Returns true if all were added, false if any couldn't be added
ChatBot.prototype.addTriggers = function(triggers) {
	var ok = true;
	var that = this;
	_.each(triggers, function(trigger) {
		ok = ok && (that.addTrigger(trigger.name, trigger.type, trigger.options) != null);
	});
	return ok;
}

// Returns true if the trigger was removed
ChatBot.prototype.removeTrigger = function(name) {
	if (name in this.triggers) {
		this.winston.debug("Chatbot "+this.name+": Deleting trigger: "+name);
		delete this.triggers[name];
		return true;
	}
	return false;
}

ChatBot.prototype.clearTriggers = function(callback) {
	var that = this;
	if(!this.options.disableWebserver) {
		//First, deinitialize the webserver
		this.server.close();
		delete this.io;
		delete this.server;
		delete this.express;
	}

	this.winston.debug("Chatbot "+this.name+": Clearing triggers");
	this.triggers = {};

	if(!this.options.disableWebserver) {
		//now reinitialize it.
		this._startWebServer(that.options.webServerPort||8080)
	}

	//allow users to redo their own webserver functions afterwards
	if(callback && callback instanceof Function) {
		callback();
	}
}

// Returns triggers in the same form that can be used for addTriggers
// [{name:"",type:"",options:{}}, {name:"",type:"",options:{}}, etc]
ChatBot.prototype.getTriggerDetails = function() {
	var triggerDetails = [];

	_.each(this.triggers, function(trigger, name) {
		triggerDetails.push({ name: name, type: trigger.type, options: trigger.getOptions() });
	});

	return triggerDetails;
}

ChatBot.prototype.sendMessage = function(steamId, message) {
	this.steamFriends.sendMessage(steamId, message);
	var haveSeenMessage = false;
	_.each(this.triggers, function(trigger) {
		var seenMessageThisTrigger = trigger.onSentMessage(steamId, message, haveSeenMessage);
		haveSeenMessage = haveSeenMessage || seenMessageThisTrigger;
	});
}

//left this here because some configs might still be using it?
ChatBot.prototype.joinGame = function(appId) {
	this.games=[appId];				//update this.games
	this.steamUser.gamesPlayed({ 'games_played': [{ 'game_id': parseInt(appId) }] });
}

//this function will play all the games it's told to. This doesn't always show
//the first game as the one being played, so there's another function that
//plays the first game, then waits a fraction of a second to play the others
ChatBot.prototype.setGames = function(appIdArray) {
	var that = this;
	this.games=appIdArray;				//update this.games
	if(this.games) this.winston.info("Chatbot "+this.name+": Playing gameIDs " + this.games.toString());
	else this.winston.info("Chatbot "+this.name+": Playing nothing");
	this.steamUser.gamesPlayed({ 'games_played': [{ 'game_id': parseInt(that.games.toString()) }] });	//play them!
}

ChatBot.prototype.setPrimaryGame = function(appId,delay) {
	this.winston.info("Chatbot "+this.name+": Setting " + appId + " as primary game.");
	if(!this.games || this.games === undefined){
		this.games=[appId];
	} else {
		this.games.unshift(appId);			//update this.games
	}
	this.winston.info("Chatbot "+this.name+": Playing gameID " + appId);
	this.steamUser.gamesPlayed({ 'games_played': [{ 'game_id': parseInt(appId) }] });		//first, play only this game, so it shows up
	var that = this;
	setTimeout(function(){
		that.winston.info("Chatbot "+that.name+": Playing gameIDs " + that.games.toString());
		that.steamUser.gamesPlayed({ 'games_played': [{ 'game_id': parseInt(that.games.toString()) }] });	//play them!
	},(delay||1000));	//play all the games in 1 second.
}

ChatBot.prototype.send = function(header, body, callback) {
	this.winston.protocol('ChatBot ' + this.name + ' sending ProtoBuf message: ' + header.msg + (header.proto ? ', ' + JSON.stringify(header.proto) : ''));
	this.steamClient.send(header, body, callback);
}

ChatBot.prototype.joinChat = function(roomId, autoJoinAfterDisconnect) {
	this.winston.info("Chat bot " + this.name + " joining room " + roomId + " with autoJoinAfterDisconnect " + autoJoinAfterDisconnect);
	this.steamFriends.joinChat(roomId);
	if (autoJoinAfterDisconnect) {
		this._addChatToAutojoin(roomId)
	}
}

ChatBot.prototype.leaveChat = function(roomId) {
	this.winston.info("Chat bot " + this.name + " leaving room " + roomId);
	this._removeChatFromAutojoin(roomId);
	this.steamFriends.leaveChat(roomId);
}

ChatBot.prototype.addFriend = function(userId) {
	this.winston.info("Chat bot " + this.name + " adding friend " + this._userString(userId));
	this.steamFriends.addFriend(userId);
}

ChatBot.prototype.removeFriend = function(userId) {
	this.winston.info("Chat bot " + this.name + " removing friend " + this._userString(userId));
	this.steamFriends.removeFriend(userId);
}

ChatBot.prototype.setPersonaName = function(name) {
	this.winston.info("Chat bot " + this.name + " changing name to " + name);
	this.steamFriends.setPersonaName(name);
}

ChatBot.prototype.setPersonaState = function(state) {
	this.winston.info("Chat bot " + this.name + " changing state to " + state);
	this.steamFriends.setPersonaState(state);
}

ChatBot.prototype.lockChat = function(roomId) {
	this.winston.info("Chat bot " + this.name + " locking chat " + roomId);
	this.steamFriends.lockChat(roomId);
}

ChatBot.prototype.unlockChat = function(roomId) {
	this.winston.info("Chat bot " + this.name + " unlocking chat " + roomId);
	this.steamFriends.unlockChat(roomId);
}

ChatBot.prototype.setModerated = function(roomId) {
	this.winston.info("Chat bot " + this.name + " moderating chat " + roomId);
	this.steamFriends.setModerated(roomId);
}

ChatBot.prototype.setUnmoderated = function(roomId) {
	this.winston.info("Chat bot " + this.name + " unmoderating chat " + roomId);
	this.steamFriends.setUnmoderated(roomId);
}

ChatBot.prototype.kick = function(roomId, userId) {
	this.winston.info("Chat bot " + this.name + " kicking " + this._userString(userId) + " from " + roomId);
	this.steamFriends.kick(roomId, userId);
}

ChatBot.prototype.ban = function(roomId, userId) {
	this.winston.info("Chat bot " + this.name + " banning " + this._userString(userId) + " from " + roomId);
	this.steamFriends.ban(roomId, userId);
}

ChatBot.prototype.unban = function(roomId, userId) {
	this.winston.info("Chat bot " + this.name + " unbanning " + this._userString(userId) + " from " + roomId);
	this.steamFriends.unban(roomId, userId);
}

ChatBot.prototype.users = function() {
	return this.steamFriends.personaStates;
}

ChatBot.prototype.rooms = function() {
	return this.steamFriends.chatRooms;
}

ChatBot.prototype.friends = function() {
	return this.steamFriends.friends;
}

ChatBot.prototype.groups = function() {
	return this.steamFriends.groups;
}

ChatBot.prototype.logOff = function() {
	this.winston.info('Chat bot ' + this.name + ' logging off');
	this.steamClient.disconnect();
}

ChatBot.prototype.chatInvite = function(chatSteamID, invitedSteamID) {
	this.winston.info("Chat bot " + this.name+': Inviting ' + invitedSteamID + ' to chat ' + chatSteamID);
	this.steamFriends.chatInvite(chatSteamID, invitedSteamID);
}

ChatBot.prototype.getSteamLevel = function(steamids) {
	this.winston.info('Chat bot ' + this.name+': Getting steam level for ' + steamids.toString());
	return this.steamFriends.getSteamLevel(steamids, function(levels) {
		return levels;
	});
}

ChatBot.prototype.setIgnoreFriend = function(steamID, setIgnore) {
	this.winston.info('Chat bot ' + this.name+': Setting ' + steamID + ' block to ' + setIgnore);
	var that = this.
	this.steamFriends.setIgnoreFriend(steamID, setIgnore, function(callback) {
		that.winston.info(callback); //i don't know what this callback does
	});
}

ChatBot.prototype.trade = function(steamID) {
	this.winston.info('Chat bot ' + this.name+': Sending trade request to ' + steamID);
	this.steamTrading.trade(steamID);
}

ChatBot.prototype.respondToTrade = function(tradeID, bool) {
	if(bool === true) {
		this.steamTrading.respondToTrade(tradeID, true);
		this.winston.info('Chat bot ' + this.name+': Accepting trade');
	} else {
		this.steamTrading.respondToTrade(tradeID, false);
		this.winston.info('Chat bot ' + this.name+': Denying trade');
	}
}

ChatBot.prototype.cancelTrade = function(steamID) {
	this.winston.info('Chat bot ' + this.name+': Cancelling trade to ' + steamID);
	this.steamTrading.cancelTrade(steamID);
}

ChatBot.prototype.steamApi = function(interface, method, version, request, options) {
	var that = this;
	if(!this.apikey) {
		that.winston.error('Usage of Steam API requires an API key');
	}
	else {
		return new Promise(function(resolve, reject) {
			var endpoint = GetInterface(interface, that.apikey);
			if(request === 'get') {
				endpoint.get(method, parseInt(version), options, function(code, response) {
					if(code !== 200) {
						reject(code);
					}
					else {
						resolve(response);
					}
				});
			}
			else if(request === 'post') {
				endpoint.post(method, parseInt(version), options, function(code, response) {
					if(code !== 200) {
						reject(code);
					}
					else {
						resolve(response);
					}
				});
			}
		});
	}
}

// "Private" functions

ChatBot.prototype._updatePersonaState = function() {
	this.steamFriends.setPersonaState(this.muted ? this.mutedState : this.unmutedState);
}

ChatBot.prototype._userString = function(id) {
	var result = (this.steamFriends.users && id in this.steamFriends.users) ? (this.steamFriends.users[id].player_name + "/") : "";
	result += id;

	return result;
};
//same as _userString, but only the name without the steamID
ChatBot.prototype._userName = function(id) {
	var result = (this.steamFriends.users && id in this.steamFriends.users) ? (this.steamFriends.users[id].player_name) : "";
	return result;
};
////
ChatBot.prototype._autojoinChatrooms = function() {
	// Auto-join chat rooms that the bot was previously invited to (and not removed from)
	if (fs.existsSync(this.autojoinFile)) {
		this.autojoinRooms = JSON.parse(fs.readFileSync(this.autojoinFile));
		var that = this;
		_.each(that.autojoinRooms, function(value, roomId) {
			that.winston.info("Chat bot " + that.name + " auto-joining room " + roomId);
			that.steamFriends.joinChat(roomId);
		});
	}
}

ChatBot.prototype._addChatToAutojoin = function(roomId) {
	if (fs.existsSync(this.autojoinFile)) {
		this.autojoinRooms = JSON.parse(fs.readFileSync(this.autojoinFile));
	}
	else {
		this.autojoinRooms = {};
	}
	this.autojoinRooms[roomId] = true;

	fs.writeFileSync(this.autojoinFile, JSON.stringify(this.autojoinRooms));
}

ChatBot.prototype._removeChatFromAutojoin = function(roomId) {
	if (fs.existsSync(this.autojoinFile)) {
		this.autojoinRooms = JSON.parse(fs.readFileSync(this.autojoinFile));
		if (this.autojoinRooms[roomId]) {
			delete this.autojoinRooms[roomId];
			fs.writeFileSync(this.autojoinFile, JSON.stringify(this.autojoinRooms));
		}
	}
}

// Steam Events

ChatBot.prototype._onConnected = function() {
	this.winston.debug('Connected to steam, logging in');
	this.logOn();
}

ChatBot.prototype._onMessage = function(header, body, callback) {
	this.winston.protocol('ChatBot ' + this.name + ' new ProtoBuf message: ' + header.msg + (header.proto ? ', ' + JSON.stringify(header.proto) : ''));
}

ChatBot.prototype._onError = function() {
	this.winston.error("Chatbot "+this.name+" disconnected");
	this.connected = false;
	this.connect();
};

ChatBot.prototype._onLogOnResponse = function(res) {
	var that = this;
	if(res.eresult === steam.EResult.OK) {
		this.winston.info("ChatBot " + this.name + " logged on");
		this.connected = true;
		this._updatePersonaState();
		this._autojoinChatrooms();
		this.steamUser.gamesPlayed({ 'games_played': [{ 'game_id': parseInt(that.games.toString()) }] });
		this.steamWebLogon.webLogOn(function(sessionid, cookies) {
			that.steamTrade.sessionID = sessionid;
			that.winston.debug('New cookie');
			that.winston.debug('New sessionid');
			that.cookie = cookies;
			that.winston.silly('New sessionid: ' + sessionid);
			that.winston.silly('New cookie: ' + cookies);
			cookies.forEach(function(cookie) {
				that.steamTrade.setCookie(cookie.trim());
			});
			if(!that.apikey) {
				GetSteamApiKey({
					sessionID: sessionid,
					webCookie: cookies
				}, function(e, api) {
					if(e) { that.winston.error('ChatBot ' + that.name + ' error getting API key: ' + e); }
					else { that.apikey = api; }
			});
			that.winston.info('ChatBot ' + that.name + ': logged into Steam web');
			}
		});
	}
	else {
		this.winston.warn("ChatBot " + this.name + ': EResult for logon response: ' + res.eresult);
		process.exit(res.eresult);
	}
}

ChatBot.prototype._onDisconnected = function() {
	this.winston.warn("ChatBot " + this.name + " disconnected");
	this.logOn();
}

ChatBot.prototype._onChatInvite = function(roomId, roomName, inviterId) {
	this.winston.info("ChatBot " + this.name + " was invited to chat in " + roomName + " (" + roomId + ")" + " by " + this._userString(inviterId));

	_.each(this.triggers, function(trigger) {
		trigger.onChatInvite(roomId, roomName, inviterId);
	});
};

ChatBot.prototype._onRelationship = function(userId, relationship) {
	this.winston.info("ChatBot " + this.name + " relationship event for " + this._userString(userId) + " type " + relationship);

	if (relationship === 2) {
		_.each(this.triggers, function(trigger) {
			trigger.onFriendRequest(userId);
		});
	}
};

ChatBot.prototype._onFriendMsg = function(userId, message, type) {
	this.winston.info("ChatBot " + this.name + " friendMsg " + type + " <" + this._userString(userId) + ">: " + message);

	if (type === steam.EChatEntryType.ChatMsg) {
		var haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			var sentMessageThisTrigger = trigger.onFriendMessage(userId, message, haveSentMessage);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
};

ChatBot.prototype._onChatMsg = function(roomId, message, type, chatterId) {
	this.winston.info("ChatBot " + this.name + " chatMsg " + type + " in " + roomId + " <" + this._userString(chatterId) + ">: " + message);

	if (type === steam.EChatEntryType.ChatMsg) {
		var that = this;
		var haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			var sentMessageThisTrigger = trigger.onChatMessage(roomId, chatterId, message, haveSentMessage, that.muted);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
};

ChatBot.prototype._onChatStateChange = function(stateChange, chatterActedOn, steamChatId, chatterActedBy) {
	this.winston.info("ChatBot " + this.name + " chatStateChange " + stateChange + " in " + steamChatId + " " + chatterActedOn + " acted on by " + chatterActedBy);
	var muted = this.muted;
	var haveSentMessage = false;
	var sentMessageThisTrigger = false;

	if ((stateChange & steam.EChatMemberStateChange.Kicked) > 0) {
		this.winston.info("Chatbot "+this.name+":"+this._userString(chatterActedOn) + " was kicked from " + steamChatId + " by " + this._userString(chatterActedBy));

		// Kicked from chat - don't autojoin
		if(chatterActedOn === this.steamClient.steamID) {
			this._removeChatFromAutojoin(steamChatId);
		}

		haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			sentMessageThisTrigger = trigger.onKickedChat(steamChatId, chatterActedOn, chatterActedBy, haveSentMessage, muted);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}

	else if ((stateChange & steam.EChatMemberStateChange.Entered) > 0) {
		this.winston.info("Chatbot "+this.name+":"+this._userString(chatterActedOn) + " joined " + steamChatId);

		haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			sentMessageThisTrigger = trigger.onEnteredChat(steamChatId, chatterActedOn, haveSentMessage, muted);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
	else if ((stateChange & steam.EChatMemberStateChange.Left) > 0) {
		this.winston.info("Chatbot "+this.name+":"+this._userString(chatterActedOn) + " left " + steamChatId);

		haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			sentMessageThisTrigger = trigger.onLeftChat(steamChatId, chatterActedOn, haveSentMessage, muted);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
	else if ((stateChange & steam.EChatMemberStateChange.Disconnected) > 0) {
		this.winston.info("Chatbot "+this.name+":"+this._userString(chatterActedOn) + " was disconnected from " + steamChatId);

		haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			sentMessageThisTrigger = trigger.onDisconnected(steamChatId, chatterActedOn, haveSentMessage, muted);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
	else if ((stateChange & steam.EChatMemberStateChange.Banned) > 0) {
		this.winston.info("Chatbot "+this.name+":"+this._userString(chatterActedOn) + " was banned from " + steamChatId);

		haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			sentMessageThisTrigger = trigger.onBannedChat(steamChatId, chatterActedOn, chatterActedBy, haveSentMessage, muted);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
};

ChatBot.prototype._onUpdateMachineAuth = function(sentry, cb) {
	if(this.sentryFile) {
		this.winston.info("Chatbot "+this.name+":Obtained sentry " + sentry.filename + ". Writing to " + this.sentryFile);
		fs.writeFileSync(this.sentryFile, sentry.bytes);
		cb({
			sha_file: crypto.createHash('sha1').update(sentry.bytes).digest()
		});
	} else {
		this.winston.info("Chatbot "+this.name+":Obtained sentry. Writing to " + this.name + ".hash", sentry);
		fs.writeFileSync("bot." + this.name + ".sentry", sentry.bytes);
		cb({
			sha_file: crypto.createHash('sha1').update(sentry.bytes).disgest()
		});
	}
}

/*
ChatBot.prototype._onWebSessionID = function(sessionid) {
	this.steamTrade.sessionID = sessionid;
	this.winston.debug('New sessionID');
	this.winston.silly('New sessionID: ', sessionid);
	var that = this;
	this.steamClient.webLogOn(function(cookie) {
		that.winston.debug('New cookie');
		that.winston.silly('New cookie: ', cookie);
		that.cookie = cookie;
		cookie.forEach(function(part) {
			that.steamTrade.setCookie(part.trim());
		});
		console.log(cookie);
        that.winston.info('Logged into Steam Web API at ' + new Date().toString());
    });
}
*/

ChatBot.prototype._onTradeOffers = function(number) { //this function gets called when someone sends a non-interactive trade offer. There are no built-in functions for dealing with this.
	this.winston.info('Chat bot ' + this.name+': New trade offer count: ' + number);
	var haveEatenEvent = false;
	_.each(this.triggers, function(trigger) {
		var eatenEventThisTrigger = trigger.onTradeOffer(number,haveEatenEvent);
		haveEatenEvent = haveEatenEvent || eatenEventThisTrigger;
	});
}

ChatBot.prototype._onTradeProposed = function(tradeID, steamID) { //interactive trading session.
	this.winston.info('Chat bot ' + this.name+': Received trade request from ' + steamID);
	var haveEatenEvent = false;
	_.each(this.triggers, function(trigger) {
		var eatenEventThisTrigger = trigger.onTradeProposed(tradeID,steamID,haveEatenEvent);
		haveEatenEvent = haveEatenEvent || eatenEventThisTrigger;
	});
}

ChatBot.prototype._onTradeResult = function(tradeID, result, steamID) {
	this.winston.info("Chatbot "+this.name+":"+result + ' from trade with ' + steamID);
}

ChatBot.prototype._onSessionStart = function(steamID) {
	this.winston.info('Chat bot ' + this.name+': Trade with ' + steamID + ' initialized');
	var haveEatenEvent = false;
	_.each(this.triggers, function(trigger) {
		var eatenEventThisTrigger = trigger.onTradeSession(steamID,haveEatenEvent);
		haveEatenEvent = haveEatenEvent || eatenEventThisTrigger;
	});
}

/* //i don't know how to do announcements, it isn't the same as before. now it uses protobufs from steamkit
ChatBot.prototype._onClanState = function(res) {
	if(res === 'announcements') { //no idea if this works, https://github.com/SteamRE/SteamKit/blob/master/Resources/Protobufs/steamclient/steammessages_clientserver.proto#L1341
	this.winston.info("Chatbot "+this.name+":"+groupID + ' posted announcement with title ' + '"' + headline + '"');
	var haveEatenEvent = false;
	_.each(this.triggers, function(trigger) {
		var eatenEventThisTrigger = trigger.onAnnouncement(groupID,headline,haveEatenEvent);
		haveEatenEvent = haveEatenEvent || eatenEventThisTrigger;
	});
}
*/

/*
 * This crap is possibly not implemented correctly/fully. Don't expect it to work right without testing it. For info, see https://github.com/seishun/node-steam

	ChatBot.prototype._onLoggedOff = function() {
		this.winston.warning("ChatBot " + this.name + " logged off!");
		_.each(this.triggers, function(trigger) {
			trigger.onLoggedOff();
		});
	}

	ChatBot.prototype._onUser = function(obscureData) {
		this.winston.info("ChatBot " + this.name + " - User event detected");
		_.each(this.triggers, function(trigger) {
			trigger.onUserEvent(obscureData);
		});
	}

	ChatBot.prototype._onFriend = function(steamId,friendRelationship) {
		this.winston.info("ChatBot " + this.name + " - Friend relationship event detected");
		_.each(this.triggers, function(trigger) {
			trigger.onFriendEvent(steamId,friendRelationship);
		});
	}

	ChatBot.prototype._onGroup = function(steamId,clanRelationship) {
		this.winston.info("ChatBot " + this.name + " - Group relationship event detected");
		_.each(this.triggers, function(trigger) {
			trigger.onGroupEvent(steamId,clanRelationship);
		});
	}

	ChatBot.prototype._onRichPresence = function(steamId,status,obscureData) {
		this.winston.info("ChatBot " + this.name + " - Rich presence event detected for user " + this._userString(steamId) + " - Status: " + status);
		_.each(this.triggers, function(trigger) {
			trigger.onRichPresence(steamId,status,obscureData);
		});
	}
*/

ChatBot.prototype.makeAnnouncement = function(target, head, body, source) {
	var that = this;
	var post_data = qs.stringify({
		"sessionID" : that.steamTrade.sessionID,
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
			"cookie" : that.cookie
		}
	};
	var post_req = http.request(post_options, function(res) {
		res.setEncoding("utf8");
		res.on("data", function(chunk) {
			that.winston.info("Announcement created: " + head);
			if(source) {
				that.steamFriends.sendMessage(source, "Announcement created: " + head);
			} else {
				return head;
			}
		});
	});
	post_req.write(post_data);
	post_req.end();
	that.winston.debug(post_data)
	that.winston.debug(post_options);
}

//Webserver stuff
ChatBot.prototype._startWebServer = function(port){
	var that = this;
	this.Express = Express;
	this.express = Express();
	this.winston.debug("Initializing webserver");
	this.server = http.createServer(this.express);
	try {
		this.server.listen(port,function(){that.winston.info('Webserver listening on '+port);});
		this.winston.debug("Webserver initialized successfully!")
	} catch(err) {
		this.winston.error(err)
		this.winston.error("ERROR starting the webserver. Most likely the port is already in use.")
	}
	this.express.use(expressWinston.logger({
		winstonInstance: that.winston,
		msg: "HTTP {{res.statusCode}} {{(req.header('x-forwarded-for') "+
		"? req.header('x-forwarded-for').split(',')[0] " +
		": req.connection.remoteAddress )}} {{req.method}} {{res.responseTime}}ms {{req.hostname+req.originalUrl}}", // customize the default logging message.
		meta: (that.options.httpMetaLog===false?false:true), // optional: control whether you want to log the meta data about the request (default to true)
		expressFormat: that.options.httpFormat||false // Use the default Express/morgan request formatting, with the same colors. Enabling this will override any msg and colorStatus if true.
		//Will only output colors on transports with colorize set to true
	}));
	if(this.options.favicon !== false) {
		this.redirect("/favicon.ico","http://i.imgur.com/UvrvFW4.png",301);
	}
	this.winston.silly("Done starting webserver. Starting socket.io");

	//Eventually, we might want sockets for some kind of live chat function. This would be nicer than reloading the page or using XmlHttpRequests.
	//Also, someone might want them for something else? I dunno. In any case, this is better.
	this.io = require("socket.io")(this.server);
}
ChatBot.prototype.redirect = function(path,destination,type) {
	if(!path || !destination) return;
	this.express.get(path,function(req,res) {
		res.redirect(type||301,destination);
	});
}
ChatBot.prototype._addRouter = function(path){
	var router = Express.Router();
	if(path) {
		this.winston.debug("Adding routing path ",path);
		this.express.use(path, router);
	} else {
		this.winston.debug("Adding routing path /");
		this.express.use(router);
	}
	return router;
}
ChatBot.prototype._getSocket = function(path) {
	if(path) {
		this.winston.debug("Adding socket namespace ",path);
		return this.io.of(path);
	}
	this.winston.debug("Adding socket namespace /");
	return this.io;
}
ChatBot.prototype._getClientIp = function(req) {
	var ipAddress;
	// Amazon EC2 / Heroku workaround to get real client IP
	var forwardedIpsStr = req.header("x-forwarded-for");
	if (forwardedIpsStr) {
		// "x-forwarded-for" header may return multiple IP addresses in
		// the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
		// the first one
		var forwardedIps = forwardedIpsStr.split(",");
		ipAddress = forwardedIps[0];
	}
	if (!ipAddress) {
		// Ensure getting client IP address still works in
		// development environment
		ipAddress = req.connection.remoteAddress;
	}
	return ipAddress;
};
ChatBot.prototype.getOrMove = function(name) {
	if(fs.existsSync(name)) {
		fs.renameSync(name,this.name+"/"+name);
	}
	return this.name+"/"+name;
}
exports.ChatBot = ChatBot;
