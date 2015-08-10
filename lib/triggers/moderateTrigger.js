var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that moderates a groupchat.
command = string - a message must start with this + a space before a response will be given
*/

var ModerateTrigger = function() {
	ModerateTrigger.super_.apply(this, arguments);
};

util.inherits(ModerateTrigger, BaseTrigger);

var type = "ModerateTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new ModerateTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!mod";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
ModerateTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
ModerateTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

ModerateTrigger.prototype._respond = function(roomId, userId, message) {
	var that = this;
	var query = this._stripCommand(message);
	if(query) {
		that.chatBot.setModerated((query.params.length > 1 ? query.params[1].toString() : roomId.toString() ));
		return true;
	}
	return false;
}

ModerateTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
