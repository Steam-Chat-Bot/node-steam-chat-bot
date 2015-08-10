var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that unmoderates a groupchat.
command = string - a message must start with this + a space before a response will be given
*/

var UnmoderateTrigger = function() {
	UnmoderateTrigger.super_.apply(this, arguments);
};

util.inherits(UnmoderateTrigger, BaseTrigger);

var type = "UnmoderateTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new UnmoderateTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!unmod";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
UnmoderateTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
UnmoderateTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

UnmoderateTrigger.prototype._respond = function(roomId, userId, message) {
	var query = this._stripCommand(message);
	if(query && (query.params[1] || roomId)) {
		this.chatBot.setUnmoderated(query.params[1] || roomId);
		return true;
	}
	return false;
}

UnmoderateTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
