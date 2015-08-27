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

DoormatTrigger.prototype._sendGreeting = function(steamId, message) {
	var that = this;
	if (this.options.delay) {
		this.winston.debug(this.chatBot.name+"/"+this.name,{"trigger":this.name,"type":this.type,"target: ":steamId,"message":message, "delay":this.options.delay});
		setTimeout(function () { that.chatBot.sendMessage(steamId, "Hello " + that.chatBot._userName(message)) }, this.options.delay);
	}
	else {
		this.chatBot.sendMessage(steamId, "Hello " + that.chatBot._userName(message));
	}
}
