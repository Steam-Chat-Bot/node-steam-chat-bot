var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Sends a message to a chat room when a user joins.
Relevant options are:
interval = int - how frequently (in ms) to send the message.
message = string - the message to write on join
destination = string - where to send the message.
*/

var MessageIntervalTrigger = function() {
	MessageIntervalTrigger.super_.apply(this, arguments);
};

util.inherits(MessageIntervalTrigger, BaseTrigger);

var type = "MessageIntervalTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new MessageIntervalTrigger(type, name, chatBot, options);
	return trigger;
};

MessageIntervalTrigger.prototype._onLoad = function() {
	setInterval(this._send, this.options.interval);
}

MessageIntervalTrigger.prototype._send = function() {
	try {
		if(this.options.destination && this.options.message && this.chatBot.connected) {
			this._sendMessageAfterDelay(this.options.destination, this.options.message);
		}
	} catch(err) {
		this.winston.error(this.chatBot.name+"/"+this.name,err.stack);
	}
}
