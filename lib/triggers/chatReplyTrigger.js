var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that responds to certain messages with specified responses.
matches = array of strings - messages that trigger the response
responses = array of strings - the response will be a randomly selected string from this array
exact = boolean - if this is true, the message received must be an exact match, if it's false the message just must contain the match (both case-insensitive)
users = array of string - the steamIds of the users that can trigger a response, can be null or empty to match all users
source = string - where to respond? in 'group', 'pm', or nothing to respond wherever the command was sent (default)
inPrivate = bool - only respond privately (true)? or everywhere (default/false)
*/

var ChatReplyTrigger = function() {
	ChatReplyTrigger.super_.apply(this, arguments);
};

util.inherits(ChatReplyTrigger, BaseTrigger);

var type = "ChatReplyTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new ChatReplyTrigger(type, name, chatBot, options);
	trigger.options.inPrivate = options.inPrivate || false;
	trigger.options.source = options.source || undefined;
	trigger.options.exact = options.exact || false;
	return trigger;
};

// Return true if a message was sent
ChatReplyTrigger.prototype._respondToFriendMessage = function(userId, message) {
	if(this.options.source==="group") {
		return false;
	}
	return this._respond(userId, message, userId);
}

// Return true if a message was sent
ChatReplyTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	if(this.options.source==="pm") {
		return false;
	}
	return this._respond(roomId, message, chatterId);
}


ChatReplyTrigger.prototype._respond = function(toId, message, fromId) {
	var dest = toId;
	if(this.options.inPrivate) {
		dest=fromId;
	}
	message = message.split("ː").join(":");
	if (!message) {
		return false;
	}
	if (this._checkMessage(message)) {
		var response = this._pickResponse();
		this._sendMessageAfterDelay(dest, response);

		return true;
	}
	return false;
}

// Check for any text match
ChatReplyTrigger.prototype._checkMessage = function(message) {
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

ChatReplyTrigger.prototype._pickResponse = function(message) {
	if (this.options.responses && this.options.responses.length > 0) {
		var index = Math.floor(Math.random() * this.options.responses.length);
		return this.options.responses[index];
	}
	return "";
}
