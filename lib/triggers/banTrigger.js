var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that tells the bot to ban someone from a groupchat. Send a steamid64. Even if you're trying to ban yourself. Be careful--only someone *in* the groupchat can unban someone.
command = string - a message must start with this + a space before a response will be given. Defaults to !leave.

Trigger only works in the groupchat you want to ban someone from. Therefore no message is required.
*/

var BanTrigger = function() {
		BanTrigger.super_.apply(this, arguments);
};

util.inherits(BanTrigger, BaseTrigger);

var type = "BanTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new BanTrigger(type, name, chatBot, options);
		trigger.options.commands = trigger.options.commands || "!unlock";
		return trigger;
};

// Return true if a message was sent
BanTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(null, userId, message); else return false;
}

// Return true if a message was sent
BanTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, chatterId, message); else return false;
}

BanTrigger.prototype._respond = function(roomId, userId, message) {
		var query = this._stripCommand(message);
		if(query) {
			this.chatBot.ban(roomId, query);
			return true;
		}
		else return false;
}

BanTrigger.prototype._stripCommand = function(message) {
		if (this.options.commands && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}