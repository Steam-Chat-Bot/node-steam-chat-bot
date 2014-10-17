var util = require('util');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
/*
Trigger that sends a status message in public to anyone joining the chat. Use rooms:[] in options to limit it to one groupchat.
options:
admin = string - steamid64 of those allowed to change the status message. If not defined, anyone can change it.
command = string - command to change the message. Defaults to !status
*/

var StatusTrigger = function() {
	StatusTrigger.super_.apply(this, arguments);
};

util.inherits(StatusTrigger, BaseTrigger);

var type = "StatusTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new StatusTrigger(type, name, chatBot, options);
	trigger.respectsMute = false;
	trigger.options.command = trigger.options.command || "!status";
	return trigger;
};

StatusTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
StatusTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

StatusTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	if(this.status) {
		this._sendMessageAfterDelay(roomId, this.status);
		return true;
	}
	return false;
}

StatusTrigger.prototype._respond = function(toId,userId,message) {
	var msg = this._stripCommand(message, this.options.command);
	if(((this.options.admin && this.options.admin==userId) || !this.options.admin) && msg) {
		msg.params.splice(0,1);
		this.status = msg.params.join(' ');
		this._sendMessageAfterDelay(toId, "Status changed!\n"+this.status);
		return true;
	}
	return false;
}

StatusTrigger.prototype._stripCommand = function(message, command) {
	if (this.options.command && message && message.toLowerCase().indexOf(command.toLowerCase()) == 0) {
		return {message: message, params: message.split(' ')};
	}
	return null;
}
