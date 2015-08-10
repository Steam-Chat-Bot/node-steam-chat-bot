var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that attempts to play games. You can specify a single gameid, or you can specify an array of gameids separated by spaces
command = string - a message must start with this + a space before a response will be given. Defaults to !play.
allowpublic = bool - allow the command to be used in a groupchat.
allowprivate = bool - allow the command to be used in a private message.
*/

var PlayGameTrigger = function() {
		PlayGameTrigger.super_.apply(this, arguments);
};

util.inherits(PlayGameTrigger, BaseTrigger);



var type = "PlayGameTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new PlayGameTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!play";
		trigger.options.allowpublic = trigger.options.allowpublic === false ? false : true;
		trigger.options.allowprivate = trigger.options.allowprivate === false ? false : true;
		return trigger;
};

// Return true if a message was sent
PlayGameTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) {
			return this._respond(userId, message);
		} else {
			return false;
		}
}

// Return true if a message was sent
PlayGameTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) {
			return this._respond(roomId, message);
		} else {
			return false;
		}
}

PlayGameTrigger.prototype._respond = function(toId, message) {
		var query = this._stripCommand(message);
		if (query) {
				var games = query.split(" ");
				this.chatBot.joinGame(games[0]);
				return true;
		}
		return false;
}

PlayGameTrigger.prototype._stripCommand = function(message) {
		if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}
