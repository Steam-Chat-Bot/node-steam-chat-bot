var util = require('util');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var winston = require('winston');
/*
Trigger that responds to messages using Wolfram Alpha.
command = string - a message must start with this + a space before a response will be given
*/

var SayTrigger = function() {
	SayTrigger.super_.apply(this, arguments);
};

util.inherits(SayTrigger, BaseTrigger);

var type = "SayTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new SayTrigger(type, name, chatBot, options);
	trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
SayTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
SayTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}


SayTrigger.prototype._respond = function(roomId, userId, message) {
try {
	var toId = roomId || userId;
	var that = this;
	var msgarray = message.split(" ");
	if(msgarray.length > 2) {
		msgarray.shift(); //remove the command
		toId = that._checkforname(msgarray.shift());	//get the place we're going to send to
		result = msgarray.join(" ");	//recombine the message part
		that._sendMessageAfterDelay(toId, result);
		return true;
	}
	return false;
}
