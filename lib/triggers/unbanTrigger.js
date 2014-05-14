var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that tells the bot to unban someone from a groupchat. Send a steamid64. Even if you're trying to unban yourself. Whoops, you can't do that anyways (you need to be in the chat)
command = string - a message must start with this + a space before a response will be given. Defaults to !unban.

Trigger only works in the groupchat you want to ban someone from.
*/

var UnbanTrigger = function() {
        UnbanTrigger.super_.apply(this, arguments);
};

util.inherits(UnbanTrigger, BaseTrigger);

var type = "UnbanTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
        var trigger = new UnbanTrigger(type, name, chatBot, options);
        trigger.options.command = trigger.options.command || "!unban";
		return trigger;
};

// Return true if a message was sent
UnbanTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(null, userId, message); else return false;
}

// Return true if a message was sent
UnbanTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, chatterId, message); else return false;
}

UnbanTrigger.prototype._respond = function(roomId, userId, message) {
		console.log(type);
        var query = this._stripCommand(message);
        if(query) {
			this.chatBot.steamClient.unban(roomId, query);
			return true;
        }
        return false;
}

UnbanTrigger.prototype._stripCommand = function(message) {
        if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
                return message.substring(this.options.command.length + 1);
        }
        return null;
}
