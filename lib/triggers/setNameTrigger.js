var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that changes the bot's profile name.
command = string - a message must start with this + a space before a response will be given
*/

var SetNameTrigger = function() {
	SetNameTrigger.super_.apply(this, arguments);
};

util.inherits(SetNameTrigger, BaseTrigger);

var type = "SetNameTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new SetNameTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!name";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
SetNameTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(message);
}

// Return true if a message was sent
SetNameTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(message);
}

SetNameTrigger.prototype._respond = function(message) {
	var query = this._stripCommand(message);
	if(query && query.params[1]) {
		query.params.splice(0,1);
		this.chatBot.setPersonaName(query.params.join(" "));
		return true;
	}
	return false;
}

SetNameTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
