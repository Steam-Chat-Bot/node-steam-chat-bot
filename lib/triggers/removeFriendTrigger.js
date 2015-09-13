var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that tells the bot to unfriend someone.
command = string - a message must start with this + a space before a response will be given
*/

var RemoveFriendTrigger = function() {
	RemoveFriendTrigger.super_.apply(this, arguments);
};

util.inherits(RemoveFriendTrigger, BaseTrigger);

var type = "RemoveFriendTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new RemoveFriendTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!unfriend";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
RemoveFriendTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(message);
}

// Return true if a message was sent
RemoveFriendTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(message);
}

RemoveFriendTrigger.prototype._respond = function(message) {
	var query = this._stripCommand(message);
	if(query && query.params[1]) {
		this.chatBot.removeFriend(query.params[1]);
		return true;
	}
	return false;
}

RemoveFriendTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
