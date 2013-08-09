var fs = require('fs');
var steam = require('steam');
var winston = require('winston');
var _ = require('underscore');

var TriggerFactory = require('./triggerFactory.js').TriggerFactory;

var serversFile = 'servers';
var autojoinFile = 'autojoin';

// Load latest servers from file
if (fs.existsSync(serversFile)) {
	steam.servers = JSON.parse(fs.readFileSync(serversFile));
}
else {
	winston.warn("No servers file found, using defaults");
}


// Bot should be usually created without options, it is a parameter mainly for testing
var ChatBot = function(username, password, options) {
	this.options = options || {};

	this.steamClient = options.client || new steam.SteamClient();
	this.username = username;
	this.password = password;
	this.guardCode = options.guardCode;
	this.sentryFile = undefined;
	this.games = [];

	if(options.sentryFile && fs.existsSync(options.sentryFile)) {
		if(options.guardCode)
			winston.warn("Options define both an existing sentryfile and a guardCode. Please remove the guardcode after this");
		winston.info("Using sentryfile as defined by options: "+options.sentryfile);
		this.sentryFile = options.sentryFile;
	} else if(!options.guardCode) {
		if(options.sentryFile)
			winston.error("Sentry file defined in config does not exist: " + options.sentryFile);
		else winston.warn("Config file does not define a sentryfile.");

		winston.info("Attempting to autodetect sentry file...");

		if(fs.existsSync('sentryfile.'+this.username+'.sentry')) {
			this.sentryFile = 'sentryfile.'+this.username+'.sentry';
			winston.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync('sentryfile.'+this.username+'.hash')) {
			this.sentryFile = 'sentryfile.'+this.username+'.hash';
			winston.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync('sentryfile.'+this.username)) {
			this.sentryFile = 'sentryfile.'+this.username;
			winston.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync('sentry.'+this.username+'.hash')) {
			this.sentryFile = 'sentry.'+this.username+'.hash';
			winston.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync('sentry.'+this.username)) {
			this.sentryFile = 'sentry.'+this.username;
			winston.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync(this.username+'.hash')) {
			this.sentryFile = this.username+'.hash';
			winston.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync(this.username+'.sentry')) {
			this.sentryFile = this.username+'.sentry';
			winston.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync('sentry')) {
			this.sentryFile = 'sentry';
			winston.warn("Sentry file sentry detected, but it may be incorrect as it does not claim a username. If correct, please rename to sentry."+this.username+".hash");
		} else winston.error("Could not detect a sentryfile, and no guardCode defined. If you have steamguard enabled, please check your email for a guardCode and add it to options.");
	} else {
		winston.warn("Config file defines a guard code and not a sentry. Sentry file will not be looked for.");
		this.guardCode = options.guardCode;
	}
		
		
	this.connected = false; // Bot is connected to the steam network
	this.muted = false; // Should not send any messages to a chat room when muted

	this.triggers = {};
	if (options.triggerFactory) {
		this.triggerFactory = options.triggerFactory;
	}
	else {
		this.triggerFactory = new TriggerFactory();
	}

	this.unmutedState = steam.EPersonaState.Online;
	this.mutedState = steam.EPersonaState.Snooze;

	if (options.autoConnect) {
		this.connect();
	}

	var that = this;

	// Connect relevant events
	this.steamClient.on('error', function(error) { that._onError(error); });
	this.steamClient.on('loggedOn',  function() { that._onLoggedOn(); });
	this.steamClient.on('disconnected', function() { that._onDisconnected(); });
	this.steamClient.on('chatInvite', function(roomId, roomName, inviterId) { that._onChatInvite(roomId, roomName, inviterId); });
	//this.steamClient.on('personaState', function(userData) { that._onPersonaState(userData); });
	this.steamClient.on('relationship', function(userId, relationship) { that._onRelationship(userId, relationship); });
	this.steamClient.on('friendMsg', function(userId, message, type) { that._onFriendMsg(userId, message, type); });
	this.steamClient.on('chatMsg', function(roomId, message, type, chatterId) { that._onChatMsg(roomId, message, type, chatterId); });
	this.steamClient.on('chatStateChange', function(stateChange, chatterActedOn, steamChatId, actedOnBy) { that._onChatStateChange(stateChange, chatterActedOn, steamChatId, actedOnBy); });
	this.steamClient.on('sentry', function(sentry) { that._onSentry(sentry); });
	
	// Store latest servers
	this.steamClient.on('servers', function(servers) {
		fs.writeFile(serversFile, JSON.stringify(servers));
	});
};


// Public interface

ChatBot.prototype.connect = function() {
	// Continuously try to reconnect if started but not connected 
	// If someone logs in as the bot it will be disconnected, so this allows the bot to recover automatically when it can
	if (this.options.autoReconnect && !this.babysitInterval) {
		var babysitTimer = this.options.babysitTimer || 5*60*1000;
		var that = this;
		this.babysitInterval = setInterval(function() { that.connect(); }, babysitTimer);
	}

	if (!this.connected) {
		try {
			if(this.sentryFile) {
				winston.info("Trying to connect chat bot " + this.username + " with sentry " + this.sentryFile);
				this.steamClient.logOn(this.username, this.password, fs.readFileSync(this.sentryFile));
			} else if (this.guardCode) {
			winston.info("Trying to connect chat bot " + this.username + " with guardCode " + this.guardCode);
				this.steamClient.logOn(this.username, this.password, this.sentryFile, this.guardCode);
			} else {
				this.steamClient.logOn(this.username, this.password);
			}
		} catch (err) {
			winston.error("Exception trying to connect chat bot " + this.username, err);
		}
	}
}

ChatBot.prototype.mute = function() {
	this.muted = true;
	this._updatePersonaState();
	this.steamClient.gamesPlayed([]);
}

ChatBot.prototype.unmute = function() {
	this.muted = false;
	this._updatePersonaState();
	this.steamClient.gamesPlayed(this.games);
}

// Add or replace a trigger - return the trigger or null
ChatBot.prototype.addTrigger = function(name, type, options) {
	if (!name || !type) return false;

	this.removeTrigger(name);

	var trigger = this.triggerFactory.createTrigger(type, name, this, options || {}, true);
	if (trigger) {
		this.triggers[name] = trigger;
		return trigger;
	}
	return null;
}

// Any duplicate names will be replaced
// triggers is of the form [{name:'',type:'',options:{}}, {name:'',type:'',options:{}}, etc]
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
		delete this.triggers[name];
		return true;
	}
	return false;
}

ChatBot.prototype.clearTriggers = function() {
	this.triggers = {};
}

// Returns triggers in the same form that can be used for addTriggers
// [{name:'',type:'',options:{}}, {name:'',type:'',options:{}}, etc]

ChatBot.prototype.getTriggerDetails = function() {
	var triggerDetails = [];

	_.each(this.triggers, function(trigger, name) {
		triggerDetails.push({ name: name, type: trigger.type, options: trigger.getOptions() });
	});

	return triggerDetails;
}

ChatBot.prototype.sendMessage = function(steamId, message) {
	this.steamClient.sendMessage(steamId, message);
}

//left this here because some configs might still be using it?
ChatBot.prototype.joinGame = function(appId) {
	this.games=[appId];				//update this.games
	this.steamClient.gamesPlayed([this.games]);
}

//this function will play all the games it's told to. This doesn't always show 
//the first game as the one being played, so there's another function that 
//plays the first game, then waits a fraction of a second to play the others
ChatBot.prototype.setGames = function(appIdArray) {
	this.games=appIdArray;				//update this.games
	winston.info("Playing gameIDs " + this.games.toString());
	this.steamClient.gamesPlayed(this.games);	//play them!
}

ChatBot.prototype.setPrimaryGame = function(appId,delay) {
	winston.info("Setting " + appId + " as primary game.");
	if(!this.games || this.games==undefined) this.games=[appId];
	else this.games.unshift(appId);			//update this.games
	winston.info("Playing gameID " + appId);
	this.steamClient.gamesPlayed([appId]);		//first, play only this game, so it shows up
	var that = this;
	setTimeout(function(){
		winston.info("Playing gameIDs " + that.games.toString());
		that.steamClient.gamesPlayed(that.games);	//play them!
	},delay);	//play all the games in 1 second.
}


ChatBot.prototype.joinChat = function(roomId, autoJoinAfterDisconnect) {
	winston.info("Chat bot " + this.username + " joining room " + roomId + " with autoJoinAfterDisconnect " + autoJoinAfterDisconnect);
	this.steamClient.joinChat(roomId);
	if (autoJoinAfterDisconnect) {
		this._addChatToAutojoin(roomId)
	}
}

ChatBot.prototype.leaveChat = function(roomId) {
	winston.info("Chat bot " + this.username + " leaving room " + roomId);

	this._removeChatFromAutojoin(roomId);

	// No support for leaving a chat room yet so this is the best we can do - it will leave all chat rooms
	this.steamClient.setPersonaState(steam.EPersonaState.Offline);
	var that = this;
	setTimeout(function() { that.steamClient.setPersonaState(steam.EPersonaState.Online); }, 5000);
}

ChatBot.prototype.addFriend = function(userId) {
	winston.info("Chat bot " + this.username + " adding friend " + this._userString(userId));
	this.steamClient.addFriend(userId);
}


// "Private" functions

ChatBot.prototype._updatePersonaState = function() {
	this.steamClient.setPersonaState(this.muted ? this.mutedState : this.unmutedState);
}

ChatBot.prototype._userString = function(id) {
	var result = (this.steamClient.users && id in this.steamClient.users) ? (this.steamClient.users[id].playerName + "/") : "";
	result += id;

	return result;
};

ChatBot.prototype._autojoinChatrooms = function() {
	// Auto-join chat rooms that the bot was previously invited to (and not removed from)
	if (fs.existsSync(autojoinFile)) {
		var autojoinRooms = JSON.parse(fs.readFileSync(autojoinFile));
		var that = this;
		_.each(autojoinRooms, function(value, roomId) {
			winston.info("Chat bot " + that.username + " auto-joining room " + roomId);
			that.steamClient.joinChat(roomId);
		});
	}
}

ChatBot.prototype._addChatToAutojoin = function(roomId) {
	if (fs.existsSync(autojoinFile)) {
		var autojoinRooms = JSON.parse(fs.readFileSync(autojoinFile));
	}
	else {
		var autojoinRooms = {};
	}
	autojoinRooms[roomId] = true;

	fs.writeFile(autojoinFile, JSON.stringify(autojoinRooms));
}

ChatBot.prototype._removeChatFromAutojoin = function(roomId) {
	if (fs.existsSync(autojoinFile)) {
		var autojoinRooms = JSON.parse(fs.readFileSync(autojoinFile));
		if (autojoinRooms[roomId]) {
			delete autojoinRooms[roomId];
			fs.writeFile(autojoinFile, JSON.stringify(autojoinRooms));
		}
	}
}

// Steam Events

ChatBot.prototype._onError = function(error) { 
	winston.error("Caught error", error);
	winston.error(error); // don't know why parameter to winston.error isn't working
	this.connected = false;
};

ChatBot.prototype._onLoggedOn = function() {
	winston.info("ChatBot " + this.username + " logged on");
	this.connected = true;
	this._updatePersonaState();
	this._autojoinChatrooms();
	this.steamClient.gamesPlayed(this.games);
//	setTimeout("this.steamClient.gamesPlayed([this.games[1]])",14400000);
}

ChatBot.prototype._onDisconnected = function() {
	winston.warn("ChatBot " + this.username + " disconnected");
	this.connected = false;
}

ChatBot.prototype._onChatInvite = function(roomId, roomName, inviterId) { 
	winston.info("ChatBot " + this.username + " was invited to chat in " + roomName + " (" + roomId + ")" + " by " + this._userString(inviterId));

	_.each(this.triggers, function(trigger) {
		trigger.onChatInvite(roomId, roomName, inviterId);
	});
};

ChatBot.prototype._onRelationship = function(userId, relationship) { 
	winston.info("ChatBot " + this.username + " relationship event for " + this._userString(userId) + " type " + relationship);

	if (relationship == steam.EFriendRelationship.PendingInvitee) {
		_.each(this.triggers, function(trigger) {
			trigger.onFriendRequest(userId);
		});
	}
};

ChatBot.prototype._onFriendMsg = function(userId, message, type) { 
	winston.info("ChatBot " + this.username + " friendMsg " + type + " <" + this._userString(userId) + ">: " + message);

	if (type == steam.EChatEntryType.ChatMsg) {
		var haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			var sentMessageThisTrigger = trigger.onFriendMessage(userId, message, haveSentMessage);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
};

ChatBot.prototype._onChatMsg = function(roomId, message, type, chatterId) { 
	winston.info("ChatBot " + this.username + " chatMsg " + type + " in " + roomId + " <" + this._userString(chatterId) + ">: " + message);

	if (type == steam.EChatEntryType.ChatMsg) {
		var that = this;
		var haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			var sentMessageThisTrigger = trigger.onChatMessage(roomId, chatterId, message, haveSentMessage, that.muted);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
};

ChatBot.prototype._onChatStateChange = function(stateChange, chatterActedOn, steamChatId, chatterActedBy) { 
	winston.info("ChatBot " + this.username + " chatStateChange " + stateChange + " in " + steamChatId + " " + chatterActedOn + " acted on by " + chatterActedBy);

	if ((stateChange & steam.EChatMemberStateChange.Kicked) > 0 && chatterActedOn == this.steamClient.steamID) {
		winston.info("ChatBot was kicked from chat room " + steamChatId + " by " + this._userString(chatterActedBy));

		// Kicked from chat - don't autojoin
		this._removeChatFromAutojoin(steamChatId);
	}

	if ((stateChange & steam.EChatMemberStateChange.Entered) > 0) {
		winston.info(this._userString(chatterActedOn) + " joined " + steamChatId);

		var that = this;
		_.each(this.triggers, function(trigger) {
			trigger.onEnteredChat(steamChatId, chatterActedOn, that.muted);
		});
	}
};

ChatBot.prototype._onSentry = function(sentry) {
	if(this.sentryFile) {
		winston.info("Obtained sentry. Writing to "+this.sentryFile);
		fs.writeFile('sentryfile.'+this.sentryFile);
	} else {
		winston.info("Obtained sentry. Writing to "+this.username+'.hash', sentry);
		fs.writeFile('sentryfile.'+this.username+'.hash', sentry);
	}
}

exports.ChatBot = ChatBot;
