var util = require("util");
var images = require("google-images");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
 Trigger that responds to messages with the first matching google image result.
 command = string - a message must start with this + a space to search google images
 */

var GoogleImagesTrigger = function() {
	GoogleImagesTrigger.super_.apply(this, arguments);
};

util.inherits(GoogleImagesTrigger, BaseTrigger);

var type = "GoogleImagesTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new GoogleImagesTrigger(type, name, chatBot, options);

	trigger.options.images = trigger.options.images || images;
	trigger.options.command = trigger.options.command || "!gi";

	return trigger;
};

// Return true if a message was sent
GoogleImagesTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
GoogleImagesTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

GoogleImagesTrigger.prototype._respond = function(toId, message) {
	var query = this._stripCommand(message);
	var that = this;

	if (! /^[a-zA-Z0-9_ ]+$/.test(query)) {
	that._sendMessageAfterDelay(toId, "Error, Invalid Syntax.");
	return false;
	}

	if (query) {
		images.search(query, function(err, results) {
			if (err || !results || results.length < 1) {
				that.winston.error(that.chatBot.name+"/"+that.name+": Error querying google images or no links found: " + err);
				that._sendMessageAfterDelay(toId, "¯\\_(ツ)_/¯");
			}
			else {
				that._sendMessageAfterDelay(toId, results[0].unescapedUrl);
			}
		});

		return true;
	}
	return false;
}

GoogleImagesTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}
