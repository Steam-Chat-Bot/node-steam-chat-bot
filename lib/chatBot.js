var steam = require('steam');
var winston = require('winston');
var _ = require('underscore');

var TriggerFactory = require('./triggerFactory.js').TriggerFactory;

// Bot should be usually created without options, it is a parameter mainly for testing
var ChatBot = function(username, password, options) {
	var options = options || {};

	this.steamClient = options.client || new steam.SteamClient();
	this.username = username;
	this.password = password;

	this.connected = false; // Bot is connected to the steam network
	this.muted = false; // Should not send any messages to a chat room when muted

	this.triggers = {};
	if (options.triggerFactory) {
		this.triggerFactory = options.triggerFactory;
	}
	else {
		this.triggerFactory = new TriggerFactory();
		this.triggerFactory.loadModules();
	}

	this.unmutedState = steam.EPersonaState.Online;
	this.mutedState = steam.EPersonaState.Snooze;

	this._connect();

	var that = this;

	// Continuously try to reconnect if started but not connected 
	// If someone logs in as the bot it will be disconnected, so this allows the bot to recover automatically when it can
	var babysitTimer = options.babysitTimer || 5*60*1000;
	this.babysitInterval = setInterval(function() { that._connect(); }, babysitTimer);

	// Connect relevant events
	this.steamClient.on('error', function(error) { that._onError(error); });
	this.steamClient.on('loggedOn',  function() { that._onLoggedOn(); });
	//this.steamClient.on('servers', function(servers) { that._onServers(servers); });
	this.steamClient.on('disconnected', function() { that._onDisconnected(); });
	this.steamClient.on('chatInvite', function(roomId, roomName, inviterId) { that._onChatInvite(roomId, roomName, inviterId); });
	//this.steamClient.on('personaState', function(userData) { that._onPersonaState(userData); });
	this.steamClient.on('relationship', function(userId, relationship) { that._onRelationship(userId, relationship); });
	this.steamClient.on('friendMsg', function(userId, message, type) { that._onFriendMsg(userId, message, type); });
	this.steamClient.on('chatMsg', function(roomId, message, type, chatterId) { that._onChatMsg(roomId, message, type, chatterId); });
	//this.steamClient.on('chatStateChange', function(stateChange, chatterActedOn, steamChatId, chatterActedBy) { that._onChatStateChange(stateChange, chatterActedOn, steamChatId, chatterActedBy); });
};


// Public interface

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

	var trigger = this.triggerFactory.createTrigger(type, name, this, options || {});
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
		triggerDetails.push({ name: name, type: trigger.getType(), options: trigger.getOptions() });
	});

	return triggerDetails;
}

ChatBot.prototype.sendMessage = function(steamId, message) {
	this.steamClient.sendMessage(steamId, message);
}

ChatBot.prototype.joinChat = function(roomId) {
	winston.info("Chat bot " + this.username + " joining room " + roomId);
    this.steamClient.joinChat(roomId);
}

ChatBot.prototype.addFriend = function(userId) {
	winston.info("Chat bot " + this.username + " adding friend " + this._userString(userId));
    this.chatBot.addFriend(userId);
}


// "Private" functions

ChatBot.prototype._connect = function() {
	if (!this.connected) {
		winston.info("Trying to connect chat bot " + this.username);
		try {
			this.steamClient.logOn(this.username, this.password);
		}
		catch (err) {
			winston.error("Exception trying to connect chat bot " + this.username, err);
		}
	}
}

ChatBot.prototype._updatePersonaState = function() {
	this.steamClient.setPersonaState(this.muted ? this.mutedState : this.unmutedState);
}

ChatBot.prototype._userString = function(id) {
	var result = (this.steamClient.users && id in this.steamClient.users) ? (this.steamClient.users[id].playerName + "/") : "";
	result += id;

	return result;
};


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


exports.ChatBot = ChatBot;