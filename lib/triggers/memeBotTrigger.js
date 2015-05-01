var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Take a random word and put a > in front of it
>random
*/

var MemeBotTrigger = function() {
	MemeBotTrigger.super_.apply(this, arguments);
};

util.inherits(MemeBotTrigger, BaseTrigger);

var type = "MemeBotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	return new MemeBotTrigger(type, name, chatBot, options);
};

// Return true if a message was sent
MemeBotTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
MemeBotTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

MemeBotTrigger.prototype._respond = function(toId, message) {
	if (this._messageTriggers(message)) {
		var replacement = this._replaceWord(message);
		this._sendMessageAfterDelay(toId, replacement);
		return true;
	}
	return false;
}

MemeBotTrigger.prototype._messageTriggers = function(message) {
	var words = message.split(" ");
	return words.length >= 1 && words.length <= 30;
}

MemeBotTrigger.prototype._replaceWord = function(message) {
	var words = message.split(" ");
	var wordToReplace = Math.floor(Math.random() * words.length);
	//var word2ToReplace = Math.floor(Math.random() * words.length);
	var firstword = words[wordToReplace];
	//var secondword = words[word2ToReplace];
	var newwords = [">", firstword];
	return newwords.join("");
}
