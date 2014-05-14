var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that changes the bot's profile name.
command = string - a message must start with this + a space before a response will be given. Defaults to !name.
allowpublic = bool - allow the command to be used in a groupchat.
allowprivate = bool - allow the command to be used in a private message.
*/

var SetNameTrigger = function() {
		SetNameTrigger.super_.apply(this, arguments);
};

util.inherits(SetNameTrigger, BaseTrigger);



var type = "SetNameTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new SetNameTrigger(type, name, chatBot, options);
		trigger.options.commands = trigger.options.commands || "!name";
		trigger.options.allowpublic = trigger.options.allowpublic || true;
		trigger.options.allowprivate = trigger.options.allowprivate || true;
		return trigger;
};

// Return true if a message was sent
SetNameTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(userId, message); else return false;
}

// Return true if a message was sent
SetNameTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, message); else return false;
}

SetNameTrigger.prototype._respond = function(toId, message) {
		var query = this._stripCommand(message);
		if (query) {
				this.chatBot.setPersonaName(query);
				return true;
		}
		else return false;
}

SetNameTrigger.prototype._stripCommand = function(message) {
		if (this.options.commands && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}