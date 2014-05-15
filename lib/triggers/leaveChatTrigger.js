var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that tells the bot to leave a groupchat (also removes the groupchat from the autojoin list)
command = string - a message must start with this + a space before a response will be given.
notify = bool - After joining, tell the new chat who told the bot to leave.
*/

var LeaveChatTrigger = function() {
	LeaveChatTrigger.super_.apply(this, arguments);
};

util.inherits(LeaveChatTrigger, BaseTrigger);

var type = "LeaveChatTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new LeaveChatTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!leave";
		trigger.options.notify = trigger.options.notify || true;
		return trigger;
};

// Return true if a message was sent
LeaveChatTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
LeaveChatTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

LeaveChatTrigger.prototype._respond = function(roomId, userId, message) {
	console.log(type);
	var query = this._stripCommand(message);
	if(query && query.params[1]) {
		if(this.options.notify)
			this._sendMessage(query, "I was commanded to leave this chat by " + this.chatBot.users()[userId].playerName + " (" + userId + "). Good bye!");
		this.chatBot.leaveChat(query.params[1]);
		return true;
	}
	return false;
}

LeaveChatTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
		return {message: message, params: message.split(' ')};
	}
	return null;
}
