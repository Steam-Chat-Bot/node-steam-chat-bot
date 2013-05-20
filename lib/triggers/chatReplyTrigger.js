var util = require('util');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that responds to certain messages with specified responses.
matches = array of strings - messages that trigger the response
responses = array of strings - the response will be a randomly selected string from this array
exact = boolean - if this is true, the message received must be an exact match, if it's false the message just must contain the match (both case-insensitive)
*/

var ChatReplyTrigger = function() {
	ChatReplyTrigger.super_.call(this);
};

util.inherits(ChatReplyTrigger, BaseTrigger);

// Return true if a message was sent
ChatReplyTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
ChatReplyTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}


ChatReplyTrigger.prototype._respond = function(toId, message) {
	if (this._messageTriggers(message)) {
		var response = this._pickResponse();
		this._sendMessageAfterDelay(toId, response);
		return true;
	}
	return false;
}

ChatReplyTrigger.prototype._messageTriggers = function(message) {
	if (!message) return false; 
	if (!this.options.matches || this.options.matches.length == 0) return true; // match-all

	for (var i=0; i < this.options.matches.length; i++) {
		var match = this.options.matches[i];
		if (this.options.exact && message.toLowerCase() == match.toLowerCase()) return true;
		if (!this.options.exact && message.toLowerCase().indexOf(match.toLowerCase()) > -1) return true;
	}

	return false;
}

ChatReplyTrigger.prototype._pickResponse = function(message) {
	if (this.options.responses && this.options.responses.length > 0) {
		var index = Math.floor(Math.random() * this.options.responses.length);
		return this.options.responses[index];
	}
	return "";
}

exports.ChatReplyTrigger = ChatReplyTrigger;
exports.triggerName = "ChatReplyTrigger";
exports.create = function(name, chatBot, options) {
	var trigger = new ChatReplyTrigger();
	trigger.init(name, chatBot, options);
	return trigger;
};
