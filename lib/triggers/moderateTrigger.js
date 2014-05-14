var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that tells the bot to moderate a groupchat. Send a steamid64 or it will unlock the current chat.
command = string - a message must start with this + a space before a response will be given. Defaults to !mod.
publicmessage = string - When used from a groupchat, sends this message before unlocking. Set to false not to send a message (Default)
privatemessage = bool - when used from elsewhere, should we tell the chat that X user told the bot to unlock chat? Defaults to true.
allowpublic = bool - allow the command to be used in a groupchat.
allowprivate = bool - allow the command to be used in a private message.
*/

var ModerateChatTrigger = function() {
		ModerateChatTrigger.super_.apply(this, arguments);
};

util.inherits(ModerateChatTrigger, BaseTrigger);



var type = "ModerateChatTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new ModerateChatTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!mod";
		trigger.options.publicmessage = trigger.options.publicmessage || false;
		trigger.options.privatemessage = trigger.options.privatemessage || true;
		trigger.options.allowpublic = trigger.options.allowpublic || true;
		trigger.options.allowprivate = trigger.options.allowprivate || true;
		return trigger;
};

// Return true if a message was sent
ModerateChatTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(null, userId, message); else return false;
}

// Return true if a message was sent
ModerateChatTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, chatterId, message); else return false;
}

ModerateChatTrigger.prototype._respond = function(roomId, userId, message) {
		console.log(type);
		var query = this._stripCommand(message);
		if(query) {
			if (this.options.privatemessage && query != roomId)
				this.chatBot.steamClient.sendMessage(query, "I have been told to moderate this chat by " + this.chatBot.steamClient.users[userId].playerName + " (" + userId + ").");
			this.chatBot.steamClient.setModerated(query);
			return true;
		} else {
			if(this.options.publicmessage)	this.chatBot.steamClient.sendMessage(roomId, this.options.publicmessage);
			this.chatBot.steamClient.setModerated(roomId);
			return true;
		}
		return false;
}

ModerateChatTrigger.prototype._stripCommand = function(message) {
		if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}
