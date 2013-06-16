var util = require('util');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that runs a function 
matches = list of strings - the strings to trigger on (case-insensitive exact match)
command = enum from Commands - the command to run (one from exports.Commands)
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

var Commands = {
	Mute: 0,
	Unmute: 1,
	LeaveChat: 2
};
exports.Commands = Commands;

// Return true if a message was sent
BotCommandTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._triggerOnMatch(message);
}

// Return true if a message was sent
BotCommandTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._triggerOnMatch(message, roomId);
}


BotCommandTrigger.prototype._triggerOnMatch = function(message, roomId) {
	if (this._messageTriggers(message)) {
		this._applyCommand(roomId);
		return true;
	}
	return false;
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

BotCommandTrigger.prototype._applyCommand = function(roomId) {
	switch (this.options.command) {
		case Commands.Mute:
			this.chatBot.mute();
			break;
		case Commands.Unmute:
			this.chatBot.unmute();
			break;
		case Commands.LeaveChat:
			if (roomId) {
				this.chatBot.leaveChat(roomId);
			}
			break;
	}
}