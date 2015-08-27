var util = require("util");
var google = require("google");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
 Trigger that responds to messages with the first matching google result.
 command = string - a message must start with this + a space to search google
 */

var GoogleTrigger = function() {
	GoogleTrigger.super_.apply(this, arguments);
};

util.inherits(GoogleTrigger, BaseTrigger);

var type = "GoogleTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new GoogleTrigger(type, name, chatBot, options);

	trigger.options.google = trigger.options.google || google;
	trigger.options.command = trigger.options.command || "!google";
	trigger.options.google.resultsPerPage = 1;

	return trigger;
};

// Return true if a message was sent
GoogleTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
GoogleTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

GoogleTrigger.prototype._respond = function(toId, message) {
	var query = this._stripCommand(message);
	if (query) {
		var that = this;
		google(query, function(err, next, links){
			if (err || !links || links.length < 1) {
				that.winston.error(that.chatBot.name+"/"+that.name+": Error querying google or no links found: " + err);
				that._sendMessageAfterDelay(toId, "¯\\_(ツ)_/¯");
			}
			else {
				that._sendMessageAfterDelay(toId, links[0].title + ": " + links[0].link);
			}
		});

		return true;
	}
	return false;
}

GoogleTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}
