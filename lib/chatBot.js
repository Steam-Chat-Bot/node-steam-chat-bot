var fs = require('fs');
var steam = require('steam');
var winston = require('winston');
var _ = require('underscore');

exports.BotCommands = require('./triggers/botCommandTrigger.js').Commands;

var TriggerFactory = require('./triggerFactory.js').TriggerFactory;

var serversFile = 'servers';
var autojoinFile = 'autojoin';
var sentryFile = 'sentry';

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

	this.sentry = undefined;
	if (sentryFile && fs.existsSync(sentryFile)) {
		this.sentry = fs.readFileSync(sentryFile);
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

	// Store latest servers
	this.steamClient.on('servers', function(servers) {
		fs.writeFile(serversFile, JSON.stringify(servers));
	});

	// Store sentry response
	this.steamClient.on('sentry', function(buffer) { 
		winston.info("Storing sentry file");
		fs.writeFile(sentryFile, buffer);
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
		winston.info("Trying to connect chat bot " + this.username);
		try {
			this.steamClient.logOn(this.username, this.password, this.sentry, this.guardCode);
		}
		catch (err) {
			winston.error("Exception trying to connect chat bot " + this.username, err);
		}
	}
}

ChatBot.prototype.mute = function() {
	this.muted = true;
	this._updatePersonaState();
}

ChatBot.prototype.unmute = function() {
	this.muted = false;
	this._updatePersonaState();
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

ChatBot.prototype.joinGame = function(appId) {
	this.steamClient.gamesPlayed([appId]);
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


exports.ChatBot = ChatBot;