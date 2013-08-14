var util = require('util');
var request = require('request');
var winston = require('winston');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var dice = require('roll');
/*
Trigger that responds to messages using Wolfram Alpha.
command = string - a message must start with this + a space before a response will be given
appId = string - the app ID to use when creating a new client
OR
client = wolfram client - use this as the client if it is passed as an option
*/

var RollTrigger = function() {
	RollTrigger.super_.apply(this, arguments);
};

util.inherits(RollTrigger, BaseTrigger);

var type = "RollTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new RollTrigger(type, name, chatBot, options);
	trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
RollTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
RollTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}


RollTrigger.prototype._respond = function(roomId, userId, message) {
	var toId = roomId || userId;
	if (!this._checkUser(toId, this))
		return false;
	if (!this._checkRoom(roomId, this))
		return false;
	if (this._checkIgnores(roomId, toId, this))
		return false;

	var that = this;
	var params = that._stripCommand(message, that);
	if(params) {
		try {
			var rolled = dice.roll(params);
			that._sendMessageAfterDelay(toId, rolled.result.toString() + (parseInt(rolled.input.quantity) > 1 ? ' ('+JSON.stringify(rolled.rolled).replace(/,/g,', ')+')' : ""));
		} catch(err) {
			that._sendMessageAfterDelay(toId, "Try using syntax from www.github.com/troygoode/node-roll");
		} return true;
	}
	return false;
}

RollTrigger.prototype._stripCommand = function(message, that) {
	if (that.options.command && message && message.toLowerCase().indexOf(that.options.command.toLowerCase() + " ") == 0) {
		return message.substring(that.options.command.length + 1);
	}
	return null;
}

RollTrigger.prototype._checkIgnores = function(roomId, toId, trigger) {
	if (!trigger.options.ignore || trigger.options.ignore.length == 0)
		return false;

	for (var i=0; i < trigger.options.ignore.length; i++)
		if (toId == trigger.options.ignore[i] || roomId == trigger.options.ignore[i])
			return true;

	return false;
}

// Check for a specific room
RollTrigger.prototype._checkRoom = function(toId, trigger) {
	if (!trigger.options.rooms || trigger.options.rooms.length == 0)
		return true;

	for (var i=0; i < trigger.options.rooms.length; i++)
		if (toId == trigger.options.rooms[i])
			return true;

	return false;
}

// Check for a specific user
RollTrigger.prototype._checkUser = function(fromId, trigger) {
	if (!trigger.options.users || trigger.options.users.length == 0) {
		return true;
	}

	for (var i=0; i < trigger.options.users.length; i++)
		if (fromId == trigger.options.users[i])
			return true;

	return false;
}
