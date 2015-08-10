var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that unlocks a groupchat.
command = string - a message must start with this + a space before a response will be given
*/

var UnlockChatTrigger = function() {
	UnlockChatTrigger.super_.apply(this, arguments);
};

util.inherits(UnlockChatTrigger, BaseTrigger);

var type = "UnlockChatTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new UnlockChatTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!unlock";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
UnlockChatTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
UnlockChatTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

UnlockChatTrigger.prototype._respond = function(roomId, userId, message) {
	var query = this._stripCommand(message);
	if(query) {
		this.chatBot.unlockChat((query.params.length > 1 ? query.params[1].toString() : roomId.toString() ));
		return true;
	}
	return false;
}

UnlockChatTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
