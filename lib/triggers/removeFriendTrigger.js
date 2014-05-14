var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that tells the bot to remove a friend.
command = string - a message must start with this + a space before a response will be given. Defaults to !unfriend.
allowpublic = bool - allow the command to be used in a groupchat.
allowprivate = bool - allow the command to be used in a private message.
*/

var RemoveFriendTrigger = function() {
		RemoveFriendTrigger.super_.apply(this, arguments);
};

util.inherits(RemoveFriendTrigger, BaseTrigger);



var type = "RemoveFriendTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new RemoveFriendTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!unfriend";
		trigger.options.allowpublic = trigger.options.allowpublic || true;
		trigger.options.allowprivate = trigger.options.allowprivate || true;
		return trigger;
};

// Return true if a message was sent
RemoveFriendTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(userId, message); else return false;
}

// Return true if a message was sent
RemoveFriendTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, message); else return false;
}

RemoveFriendTrigger.prototype._respond = function(toId, message) {
		console.log(type);
		var query = this._stripCommand(message);
		if (query) {
				this.chatBot.steamClient.removeFriend(query);
				return true;
		}
		return false;
}

RemoveFriendTrigger.prototype._stripCommand = function(message) {
		if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}
