var util = require('util');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var winston = require('winston');
/*
Trigger that tells the bot to ban someone from a groupchat. Send a steamid64.
command = string - a message must start with this + a space before a response will be given
*/

var BanTrigger = function() {
	BanTrigger.super_.apply(this, arguments);
};

util.inherits(BanTrigger, BaseTrigger);

var type = "BanTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new BanTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!ban";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
BanTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
BanTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

BanTrigger.prototype._respond = function(roomId, userId, message) {
	console.log(type);
	var query = this._stripCommand(message);
	if(query && query.params[1] && (roomId || query.params[2])) {
		this.chatBot.ban(query.params[2] || roomId, query.params[1])
		return true;
	}
	return false;
}

BanTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
		return {message: message, params: message.split(' ')};
	}
	return null;
}
