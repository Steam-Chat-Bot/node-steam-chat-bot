var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Sends a message to a chat room when a user joins.
Relevant options are:
user = string - the user to trigger on
message = string - the message to write on join
*/

var MessageOnJoinTrigger = function() {
	MessageOnJoinTrigger.super_.apply(this, arguments);
};

util.inherits(MessageOnJoinTrigger, BaseTrigger);

var type = "MessageOnJoinTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new MessageOnJoinTrigger(type, name, chatBot, options);
	trigger.allowMessageTriggerAfterResponse = true;
	return trigger;
};

MessageOnJoinTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	if (userId === this.options.user) {
		this._sendMessageAfterDelay(roomId, this.options.message);
		return true;
	}
	return false;
}
