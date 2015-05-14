var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that responds to specific chat messages via PM. 
Useful for long lists where ChatReplyTrigger would result in spam.
*/

var ChatPmTrigger = function() {
	ChatPmTrigger.super_.apply(this, arguments);
};

util.inherits(ChatPmTrigger, BaseTrigger);

var type = "ChatPmTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new ChatPmTrigger(type, name, chatBot, options);
	return trigger;
};

// Return true if a message was sent
ChatPmTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message, userId);
}

// Return true if a message was sent
ChatPmTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(chatterId, message, chatterId);
}


ChatPmTrigger.prototype._respond = function(toId, message, fromId) {
	if (this._messageTriggers(toId, message, fromId)) {
		var response = this._pickResponse();
		this._sendMessageAfterDelay(toId, response);
		return true;
	}
	return false;
}

ChatPmTrigger.prototype._messageTriggers = function(toId, message, fromId) {
	if (!message) {
		return false; 
	}

	if (!this._checkMessage(message)) {
		return false;
	}

	return true;
}

// Check for any text match
ChatPmTrigger.prototype._checkMessage = function(message) {
	if (!this.options.matches || this.options.matches.length === 0) {
		return true; // match-all
	}

	for (var i=0; i < this.options.matches.length; i++) {
		var match = this.options.matches[i];
		if ((this.options.exact && message.toLowerCase() === match.toLowerCase()) || 
			(!this.options.exact && message.toLowerCase().indexOf(match.toLowerCase()) >= 0)) {

			return true;
		}
	}

	return false;
}

ChatPmTrigger.prototype._pickResponse = function(message) {
	if (this.options.responses && this.options.responses.length > 0) {
		var index = Math.floor(Math.random() * this.options.responses.length);
		return this.options.responses[index];
	}
	return "";
}
