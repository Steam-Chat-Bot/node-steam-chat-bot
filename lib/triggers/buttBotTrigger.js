var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that randomly responds to a message, replacing one word in the message with a specified replacement
Trigger that randomly responds to a message, replacing one word in the message with a specified butt
replacement = string - word to use as a replacement
*/

var ButtBotTrigger = function() {
	ButtBotTrigger.super_.apply(this, arguments);
};

util.inherits(ButtBotTrigger, BaseTrigger);

var type = "ButtBotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	return new ButtBotTrigger(type, name, chatBot, options);
};

// Return true if a message was sent
ButtBotTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
ButtBotTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

ButtBotTrigger.prototype._respond = function(toId, message) {
	if (this._messageTriggers(message)) {
		var replacement = this._replaceWord(message);
		this._sendMessageAfterDelay(toId, replacement);
		return true;
	}
	return false;
}

ButtBotTrigger.prototype._messageTriggers = function(message) {
	var words = message.split(" ");
	return words.length >= 2 && words.length <= 20;
}

ButtBotTrigger.prototype._replaceWord = function(message) {
	var words = message.split(" ");
	var wordToReplace = Math.floor(Math.random() * words.length);
	words[wordToReplace] = this.options.replacement;
	return words.join(" ");
}