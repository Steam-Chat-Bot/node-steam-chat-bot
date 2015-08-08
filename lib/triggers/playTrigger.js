var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that attempts to play games. You can specify a single gameid, or you can specify an array of gameids separated by spaces
command = string - a message must start with this + a space before a response will be given. Defaults to !play.
*/

var PlayTrigger = function() {
	PlayTrigger.super_.apply(this, arguments);
};

util.inherits(PlayTrigger, BaseTrigger);

var type = "PlayTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new PlayTrigger(type, name, chatBot, options);
	trigger.options.command = trigger.options.command || "!play";
	return trigger;
};

// Return true if a message was sent
PlayTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
PlayTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}


PlayTrigger.prototype._respond = function(toId, message) {
	//var steamid = this._stripCommand(message);
	//bot.setGames
	return false;
}

PlayTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}
