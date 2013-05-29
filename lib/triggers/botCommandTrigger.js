var util = require('util');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that runs a function 
matches = list of strings - the strings to trigger on (case-insensitive exact match)
command = enum from Commands - the command to run (one from exports.Commands)
*/

var BotCommandTrigger = function() {
	BotCommandTrigger.super_.call(this);
};

util.inherits(BotCommandTrigger, BaseTrigger);

var Commands = {
	Mute: 0,
	Unmute: 1,
};

// Return true if a message was sent
BotCommandTrigger.prototype._respondToFriendMessage = function(userId, message) {
	this._triggerOnMatch(message);
	return false; // Never responds
}

// Return true if a message was sent
BotCommandTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	this._triggerOnMatch(message);
	return false;  // Never responds
}


BotCommandTrigger.prototype._triggerOnMatch = function(message) {
	if (this._messageTriggers(message)) {
		this._applyCommand();
	}
}

BotCommandTrigger.prototype._messageTriggers = function(message) {
	if (!message) return false; 

	for (var i=0; i < this.options.matches.length; i++) {
		var match = this.options.matches[i];
		if (message.toLowerCase() == match.toLowerCase()) {
			return true;
		}
	}

	return false;
}

BotCommandTrigger.prototype._applyCommand = function() {
	switch (this.options.command) {
		case Commands.Mute:
			this.chatBot.mute();
			break;
		case Commands.Unmute:
			this.chatBot.unmute();
			break;
	}
}

exports.Commands = Commands;

exports.BotCommandTrigger = BotCommandTrigger;
BotCommandTrigger.prototype.getType = function() { return "BotCommandTrigger"; }
exports.triggerType = BotCommandTrigger.prototype.getType();
exports.create = function(name, chatBot, options) {
	var trigger = new BotCommandTrigger();
	trigger.init(name, chatBot, options);
	trigger.allowMessageTriggerAfterResponse = true;
	trigger.respectsMute = false;
	return trigger;
};
