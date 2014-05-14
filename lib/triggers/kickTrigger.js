var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that tells the bot to kick someone from a groupchat. Send a steamid64. Even if you're trying to kick yourself.
command = string - a message must start with this + a space before a response will be given. Defaults to !leave.

Trigger only works in the groupchat you want to kick someone from. Therefore no message is required.
*/

var KickTrigger = function() {
		KickTrigger.super_.apply(this, arguments);
};

util.inherits(KickTrigger, BaseTrigger);



var type = "KickTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new KickTrigger(type, name, chatBot, options);
		trigger.options.commands = trigger.options.commands || "!unlock";
		return trigger;
};

// Return true if a message was sent
KickTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(null, userId, message); else return false;
}

// Return true if a message was sent
KickTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, chatterId, message); else return false;
}

KickTrigger.prototype._respond = function(roomId, userId, message) {
		var query = this._stripCommand(message);
		if(query) {
			this.chatBot.kick(roomId, query);
			return true;
		}
		else return false;
}

KickTrigger.prototype._stripCommand = function(message) {
		if (this.options.commands && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}