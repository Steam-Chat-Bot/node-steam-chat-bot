var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Greets an entering user with "Hello Name". Omits the steamID.
*/

var DoormatTrigger = function() {
	DoormatTrigger.super_.apply(this, arguments);
};

util.inherits(DoormatTrigger, BaseTrigger);

var type = "DoormatTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new DoormatTrigger(type, name, chatBot, options);
	trigger.allowMessageTriggerAfterResponse = true;
	return trigger;
};

DoormatTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
		this._sendGreeting(roomId, userId);
		return true;
}
