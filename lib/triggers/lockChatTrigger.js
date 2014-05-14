var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that tells the bot to lock a groupchat. Send a steamid64 or it will lock the current chat.
command = string - a message must start with this + a space before a response will be given. Defaults to !lock.
publicmessage = string - When used from a groupchat, sends this message before locking. Set to false not to send a message.
privatemessage = bool - when used from elsewhere, should we tell the chat that X user told the bot to lock chat? Defaults to true.
allowpublic = bool - allow the command to be used in a groupchat.
allowprivate = bool - allow the command to be used in a private message.
*/

var LockChatTrigger = function() {
		LockChatTrigger.super_.apply(this, arguments);
};

util.inherits(LockChatTrigger, BaseTrigger);



var type = "LockChatTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new LockChatTrigger(type, name, chatBot, options);
		trigger.options.commands = trigger.options.commands || "!lock";
		trigger.options.publicmessage = trigger.options.publicmessage || false;
		trigger.options.privatemessage = trigger.options.privatemessage || true;
		trigger.options.allowpublic = trigger.options.allowpublic || true;
		trigger.options.allowprivate = trigger.options.allowprivate || true;
		return trigger;
};

// Return true if a message was sent
LockChatTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(null, userId, message); else return false;
}

// Return true if a message was sent
LockChatTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, chatterId, message); else return false;
}

LockChatTrigger.prototype._respond = function(roomId, userId, message) {
		var query = this._stripCommand(message);
		if(query) {
			if (this.options.privatemessage && query != roomId)
				this.chatBot.sendMessage(query, "I have been told to lock this chat by " + this.chatBot.users[userId].playerName + " (" + userId + ").";
			this.chatBot.lockChat(query);
			return true;
		} else {
			if(this.options.publicmessage)	this.chatBot.sendMessage(roomId, this.options.publicmessage);
			this.chatBot.lockChat(roomId);
			return true;
		}
		else return false;
}

LockChatTrigger.prototype._stripCommand = function(message) {
		if (this.options.commands && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}