var util = require('util');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var winston = require('winston');
/*
Trigger that tells the bot to send someone a friend request.
command = string - a message must start with this + a space before a response will be given
*/

var AddfRiendTrigger = function() {
	AddfRiendTrigger.super_.apply(this, arguments);
};

util.inherits(AddfRiendTrigger, BaseTrigger);

var type = "AddfRiendTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new AddfRiendTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!friend";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
AddfRiendTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(message);
}

// Return true if a message was sent
AddfRiendTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(message);
}

AddfRiendTrigger.prototype._respond = function(message) {
	console.log(type);
	var query = this._stripCommand(message);
	if(query && query.params[1]) {
		this.chatBot.addFriend(query.params[1])
		return true;
	}
	return false;
}

AddfRiendTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
		return {message: message, params: message.split(' ')};
	}
	return null;
}
