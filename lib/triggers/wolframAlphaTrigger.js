var util = require("util");
var wolfram = require("wolfram");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that responds to messages using Wolfram Alpha.
command = string - a message must start with this + a space before a response will be given
appId = string - the app ID to use when creating a new client
OR
client = wolfram client - use this as the client if it is passed as an option
*/

var WolframAlphaTrigger = function() {
	WolframAlphaTrigger.super_.apply(this, arguments);
};

util.inherits(WolframAlphaTrigger, BaseTrigger);

var type = "WolframAlphaTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new WolframAlphaTrigger(type, name, chatBot, options);
	trigger.options.command = trigger.options.command || "!wolfram";

	trigger.client = trigger.options.client || wolfram.createClient(trigger.options.appId);

	return trigger;
};

// Return true if a message was sent
WolframAlphaTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
WolframAlphaTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}


WolframAlphaTrigger.prototype._respond = function(toId, message) {
	var question = this._stripCommand(message);
	if (question) {
		var that = this;
		this.client.query(question, function(err, result) {
			if (err) {
				that._sendMessageAfterDelay(toId, "¯\\_(ツ)_/¯");
				return;
			}

			var bestResult = that._getBestResult(result);
			if (bestResult) {
				that._sendMessageAfterDelay(toId, bestResult);
			}
			else {
				that._sendMessageAfterDelay(toId, "¯\\_(ツ)_/¯");
			}
		});

		return true;
	}
	return false;
}

WolframAlphaTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}

var _extractResult = function(result) {
	if (result.subpods[0] && result.subpods[0].value) {
		return result.subpods[0].value;
	}
	else if (result.subpods[0] && result.subpods[0].image) {
		return result.subpods[0].image;
	}
	return null;
}

WolframAlphaTrigger.prototype._getBestResult = function(results) {
	if (results) {
		// Look for primary result first
		for (var i=0; i < results.length; i++) {
			if (results[i].primary) {
				var text = _extractResult(results[i]);
				if (text) {
					return text;
				}
			}
		}

		// Otherwise just get the 2nd result (1st is the input interpretation)
		if (results.length > 1) {
			var restext = _extractResult(results[1]);
			if (restext) {
				return restext;
			}
		}
	}
	return null;
}