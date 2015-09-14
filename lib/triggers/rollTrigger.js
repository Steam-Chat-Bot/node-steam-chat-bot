var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var Roll = require("roll");
var dice = new Roll();
/*
Trigger that responds to messages using Wolfram Alpha.
command = string(!roll) - a message must start with this + a space before a response will be given
maxDice = int(64) - maximum number of dice you can roll at a time. Don't set it too high, or you'll crash the process.
maxSize = int(2^53-1) - maximum size of a die. The default value is actually Number.MAX_SAFE_INTEGER. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER.
			You can set this higher if you'd like, probably somewhere around Number.MAX_VALUE (~1.7e+308; anything higher than this is Infinity). See. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_VALUE
			However, keep in mind that setting this higher means you won't actually be getting a random number anymore, as this is the maximum precision for an integer.
*/

var RollTrigger = function() {
	RollTrigger.super_.apply(this, arguments);
};

util.inherits(RollTrigger, BaseTrigger);

var type = "RollTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new RollTrigger(type, name, chatBot, options);
	trigger.options.command = trigger.options.command || "!roll";
	trigger.options.maxDice = trigger.options.maxDice || 64;
	trigger.options.maxSize = trigger.options.maxSize || Number.MAX_SAFE_INTEGER;
	trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
RollTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
RollTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}


RollTrigger.prototype._respond = function(roomId, userId, message) {
	var toId = roomId || userId;

	var that = this;
	var params = that._stripCommand(message, that);
	if(!params) {
		return false;
	}
	var split = params.split('d');
	if(parseInt(split[0]) === 1) {
		try {
			var rolled = dice.roll(params);
			var result = rolled.result.toString();
			if(parseInt(rolled.input.quantity > 1)) {
				result += " ("+JSON.stringify(rolled.rolled).replace(/,/g,", ")+")";
			}
			that._sendMessageAfterDelay(toId, result);
		} catch(err) {
			that._sendMessageAfterDelay(toId, "Try using syntax from www.github.com/troygoode/node-roll");
		}
	} else if(parseInt(split[0]) > this.options.maxDice || parseInt(split[1]) > this.options.maxSize) {
		this._sendMessageAfterDelay(toId, 'You cannot specify such a large number');
	} else {
		try {
			var rolled = dice.roll(params);
			var result = rolled.result.toString();
			if(parseInt(rolled.input.quantity > 1)) {
				result += " ("+JSON.stringify(rolled.rolled).replace(/,/g,", ")+")";
			}
			that._sendMessageAfterDelay(toId, result);
		} catch(err) {
			that._sendMessageAfterDelay(toId, "Try using syntax from www.github.com/troygoode/node-roll");
		}
	}
	return true;
}

RollTrigger.prototype._stripCommand = function(message, that) {
	if (that.options.command && message && message.toLowerCase().indexOf(that.options.command.toLowerCase() + " ") === 0) {
		return message.substring(that.options.command.length + 1);
	}
	return null;
}
