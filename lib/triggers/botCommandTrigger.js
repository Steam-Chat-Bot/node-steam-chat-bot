var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that runs a specified callback on a bot object
matches = list of strings - the strings to trigger on (case-insensitive exact match)
exact = boolean - true to only trigger on an exact match, false to trigger on partial match
callback = callback function, passed the bot, or:
           callback can also be an array where the first element is the name of
           a public method of the ChatBot. The rest of the array is passed in as args
*/

var BotCommandTrigger = function() {
	BotCommandTrigger.super_.apply(this, arguments);
};

util.inherits(BotCommandTrigger, BaseTrigger);

var type = "BotCommandTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new BotCommandTrigger(type, name, chatBot, options);

	trigger.allowMessageTriggerAfterResponse = true;
	trigger.respectsMute = false;

	return trigger;
};

// Return true if a message was sent
BotCommandTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._triggerOnMatch(userId,userId,message);
}

// Return true if a message was sent
BotCommandTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._triggerOnMatch(chatterId,roomId,message);
}


BotCommandTrigger.prototype._triggerOnMatch = function(fromId,toId,message) {
	if (this._messageTriggers(message) && this.options.callback) {
		if ('function' === typeof this.options.callback) {
			if (this.options.callback.length === 1) { // check number of args
				this.options.callback(this.chatBot);
			} else {
				this.options.callback(this.chatBot, {toId: toId, fromId: fromId, message: message});
			}
		} else {
			if ('string' === typeof this.options.callback) {
				this.options.callback = [this.options.callback];
			}
			var callbackArgs = this.options.callback.slice();
			var callback = callbackArgs.shift();
			if (typeof callback === "string" && callback.substring(0, 1) !== "_" && callback in this.chatBot
				&& this.chatBot[callback].length === callbackArgs.length) {
				this.chatBot[callback].apply(this.chatBot, callbackArgs);
			}
		}
		return true;
	}
	return false;
}

BotCommandTrigger.prototype._messageTriggers = function(message) {
	if (!message) {
		return false; 
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
