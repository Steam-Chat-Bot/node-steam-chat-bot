var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that makes the bot kick a user from a groupchat. Send a steamid64.
command = string - a message must start with this + a space before a response will be given
*/

var KickTrigger = function() {
	KickTrigger.super_.apply(this, arguments);
};

util.inherits(KickTrigger, BaseTrigger);

var type = "KickTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new KickTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!kick";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
KickTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
KickTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

KickTrigger.prototype._respond = function(roomId, userId, message) {
	var query = this._stripCommand(message);
	if(query && query.params[1] && (roomId || query.params[2])) {
		this.chatBot.kick((query.params[2] || roomId), query.params[1]);
		return true;
	}
	return false;
}

KickTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
