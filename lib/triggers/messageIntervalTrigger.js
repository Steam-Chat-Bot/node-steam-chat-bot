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
	setInterval(function(){this._send(this)}, this.options.interval);
}

MessageIntervalTrigger.prototype._send = function(that) {
		try {
		if(that.options.destination && that.options.message && that.chatBot.connected) {
			that._sendMessageAfterDelay(that.options.destination, that.options.message);
		}
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name,err.stack);
	}
}
