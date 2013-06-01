var winston = require('winston');
var _ = require('underscore');

var BaseTrigger = function() {
};

/*
Base class for all triggers, contining shared implementation code.
Relevant options shared across all triggers:
delay = number - delay between when a _sendMessageAfterDelay is called to when it is actually sent to steam
probability = number - before any other checks occur, a random number generated between 0-1 must be smaller than this number
timeout = - after the trigger fires, it cannot be fired again until after this timout lapses
*/

// Public interface of all triggers

// Pseudo-constructor since constructor arguments don't work with inheritance
BaseTrigger.prototype.init = function(name, chatBot, options) {
	this.name = name;
	this.chatBot = chatBot;
	this.options = options || {};
	this.respectsMute = true;
	this.allowMessageTriggerAfterResponse = false;
	this.replyEnabled = true;
}

BaseTrigger.prototype.getOptions = function() {
	return _.clone(this.options);
}

// Returns true if the invite is accepted
BaseTrigger.prototype.onChatInvite = function(roomId, roomName, inviterId) {
	return this._respondToChatInvite(roomId, roomName, inviterId);
}

// Returns true if the request is accepted
BaseTrigger.prototype.onFriendRequest = function(userId) {
	return this._respondToFriendRequest(userId);
}

// Return true if a message was sent
BaseTrigger.prototype.onFriendMessage = function(userId, message, haveSentMessage) {
	if (this.replyEnabled && this._randomRoll() && this._checkMultiResponse(haveSentMessage)) {
		var messageSent = this._respondToFriendMessage(userId, message);
		if (messageSent) {
			this._disableForTimeout();
		}
		return messageSent;
	}
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype.onChatMessage = function(roomId, chatterId, message, haveSentMessage, muted) {
	if (this.replyEnabled && this._randomRoll() && this._checkMultiResponse(haveSentMessage) && this._checkMute(muted)) {
		var messageSent = this._respondToChatMessage(roomId, chatterId, message);
		if (messageSent) {
			this._disableForTimeout();
		}
		return messageSent;
	}
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype.onEnteredChat = function(roomId, userId, muted) {
	if (this.replyEnabled && this._randomRoll() && this._checkMute(muted)) {
		var messageSent = this._respondToEnteredMessage(roomId, userId);
		if (messageSent) {
			this._disableForTimeout();
		}
		return messageSent;
	}
	return false;
}


// Subclasses should override the relevant functions below

// Returns true if the invite is accepted
BaseTrigger.prototype._respondToChatInvite = function(roomId, roomName, inviterId) {
	return false;
}

// Returns true if the request is accepted
BaseTrigger.prototype._respondToFriendRequest = function(userId) {
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype._respondToFriendMessage = function(userId, message, haveSentMessage) {
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message, haveSentMessage, muted) {
	return false;
}

BaseTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	return false;
}



// Helper functions

BaseTrigger.prototype._checkMute = function(muted) {
	return !muted || !this.respectsMute;
}

BaseTrigger.prototype._checkMultiResponse = function(haveSentMessage) {
	return !haveSentMessage || this.allowMessageTriggerAfterResponse;
}

BaseTrigger.prototype._randomRoll = function() {
	if (this.options.probability) {
		var random = Math.random();
		if (random > this.options.probability) {
			return false;
		}
	}

	return true;
}

BaseTrigger.prototype._sendMessageAfterDelay = function(steamId, message) {
	if (this.options.delay) {
		var that = this;
		setTimeout(function () { that.chatBot.sendMessage(steamId, message) }, this.options.delay);
	}
	else {
		this.chatBot.sendMessage(steamId, message);
	}
}

BaseTrigger.prototype._disableForTimeout = function() {
	if (this.options.timeout) {
		this.replyEnabled = false;
		var that = this;
		setTimeout(function() { that.replyEnabled = true }, this.options.timeout);
	}
}


// Subclasses should also give themselves a unique triggerType and create function so that they can be created by the TriggerFactory
exports.BaseTrigger = BaseTrigger;
var type = "BaseTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new BaseTrigger();
	trigger.init(name, chatBot, options);
	trigger.type = type;
	return trigger;
};

/*
Skeleton for new triggers
-------------------------

var util = require('util');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

var NewTrigger = function() {
	NewTrigger.super_.call(this);
};

util.inherits(NewTrigger, BaseTrigger);

NewTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	// etc
	return false;
}

// Other overrides/functions

var type = "NewTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new NewTrigger();
	trigger.init(name, chatBot, options);
	trigger.type = type;
	// Extra initialization can go here or in a new init function that calls the base one
	return trigger;
};
*/