var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that tells the bot to join a groupchat.
command = string - a message must start with this + a space before a response will be given. Defaults to !join.
notify = bool - After joining, tell the new chat who told the bot to join.
*/

var JoinChatTrigger = function() {
	JoinChatTrigger.super_.apply(this, arguments);
};

util.inherits(JoinChatTrigger, BaseTrigger);

var type = "JoinChatTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new JoinChatTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!join";
		trigger.options.notify = trigger.options.notify === false ? false : true;
		return trigger;
};

// Return true if a message was sent
JoinChatTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
JoinChatTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

JoinChatTrigger.prototype._respond = function(roomId, userId, message) {
	var query = this._stripCommand(message);
	if(query && query.params[1]) {
		this.chatBot.joinChat(query.params[1]);
		if(this.options.notify) {
			this._sendMessageAfterDelay(query.params[1], "Hello. I was commanded to join this chat by " + this.chatBot.users()[userId].playerName + " (" + userId + ").");
		}
		return true;
	}
	return false;
}

JoinChatTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
