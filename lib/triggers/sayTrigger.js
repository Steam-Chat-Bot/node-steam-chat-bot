var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that makes the bot send a message to a groupchat or private message a person.
command = string - a message must start with this + a space before a response will be given
*/

var SayTrigger = function() {
	SayTrigger.super_.apply(this, arguments);
};

util.inherits(SayTrigger, BaseTrigger);

var type = "SayTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new SayTrigger(type, name, chatBot, options);
		trigger.options.users = options.users || undefined;
		trigger.options.command = trigger.options.command || "!say";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
SayTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
SayTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

SayTrigger.prototype._respond = function(roomId, userId, message) {
	var toId = roomId || userId;
	var query = this._stripCommand(message);
	if(query && query.params[2]) {
		query.params.splice(0,1); //dump the command.
		toId = query.params.splice(0,1)[0]; //extract the steamid
		this._sendMessageAfterDelay(toId, query.params.join(" ")); //send the message
		return true;
	}
	return false;
}

SayTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
