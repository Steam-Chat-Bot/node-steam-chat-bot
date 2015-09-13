var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that tells the bot to unban someone from a groupchat. Send a steamid64.
command = string - a message must start with this + a space before a response will be given
*/

var UnbanTrigger = function() {
	UnbanTrigger.super_.apply(this, arguments);
};

util.inherits(UnbanTrigger, BaseTrigger);

var type = "UnbanTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new UnbanTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!unban";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
UnbanTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
UnbanTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

UnbanTrigger.prototype._respond = function(roomId, userId, message) {
	var query = this._stripCommand(message);
	if(query && query.params[1] && (roomId || query.params[2])) {
		this.chatBot.unban(query.params[2] || roomId, query.params[1]);
		return true;
	}
	return false;
}

UnbanTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
