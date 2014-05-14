var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that tells the bot to join a groupchat.
command = string - a message must start with this + a space before a response will be given. Defaults to !join.
notify = bool - After joining, tell the new chat who told the bot to join.
allowpublic = bool - allow the command to be used in a groupchat.
allowprivate = bool - allow the command to be used in a private message.
*/

var JoinChatTrigger = function() {
		JoinChatTrigger.super_.apply(this, arguments);
};

util.inherits(JoinChatTrigger, BaseTrigger);



var type = "JoinChatTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new JoinChatTrigger(type, name, chatBot, options);
		trigger.options.commands = trigger.options.commands || "!join";
		trigger.options.allowpublic = trigger.options.allowpublic || true;
		trigger.options.allowprivate = trigger.options.allowprivate || true;
		trigger.options.notify = trigger.options.notify || true;
		return trigger;
};

// Return true if a message was sent
JoinChatTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(null, userId, message); else return false;
}

// Return true if a message was sent
JoinChatTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, chatterId, message); else return false;
}

JoinChatTrigger.prototype._respond = function(roomId, userId, message) {
		var query = this._stripCommand(message);
		if (query) {
				this.chatBot.joinChat(query);
				if(this.options.notify)
					this.chatBot.sendMessage(query, "Hello. I was commanded to join this chat by " + this.chatBot.users[userId].playerName + " (" + userId + ").";
				return true;
		}
		else return false;
}

JoinChatTrigger.prototype._stripCommand = function(message) {
		if (this.options.commands && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}