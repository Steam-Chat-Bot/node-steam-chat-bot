var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that tells the bot to leave a groupchat. Send a steamid64 or it will leave the current chat.
command = string - a message must start with this + a space before a response will be given. Defaults to !leave.
publicmessage = string - When used from a groupchat, sends this message before leaving. Set to false not to send a message.
privatemessage = bool - when used from elsewhere, should we tell the chat that X user told the bot to leave? Defaults to true.
allowpublic = bool - allow the command to be used in a groupchat.
allowprivate = bool - allow the command to be used in a private message.
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
		trigger.options.publicmessage = trigger.options.publicmessage || "OK! Bye";
		trigger.options.privatemessage = trigger.options.privatemessage || true;
		trigger.options.allowpublic = trigger.options.allowpublic || true;
		trigger.options.allowprivate = trigger.options.allowprivate || true;
		return trigger;
};

// Return true if a message was sent
LeaveChatTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(null, userId, message); else return false;
}

// Return true if a message was sent
LeaveChatTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, chatterId, message); else return false;
}

LeaveChatTrigger.prototype._respond = function(roomId, userId, message) {
		console.log(type);
		var query = this._stripCommand(message);
		if(query && query!=roomId) {
			if (this.options.privatemessage && query != roomId)
				this.chatBot.steamClient.sendMessage(query, "I have been told to leave by " + this.chatBot.steamClient.users[userId].playerName + " (" + userId + "). Goodbye.");
			this.chatBot.steamClient.leaveChat(query);
			return true;
		} else {
			if(this.options.publicmessage)	this.chatBot.steamClient.sendMessage(roomId, this.options.publicmessage);
			this.chatBot.steamClient.leaveChat(roomId);
			return true;
		}
		return false;
}

LeaveChatTrigger.prototype._stripCommand = function(message) {
		if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}
