var util = require('util');
var wolfram = require('wolfram');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that responds to messages using Wolfram Alpha.
command = string - a message must start with this + a space before a response will be given
appId = string - the app ID to use when creating a new client
OR
client = wolfram client - use this as the client if it is passed as an option
*/

var WolframAlphaTrigger = function() {
	WolframAlphaTrigger.super_.call(this);
};

util.inherits(WolframAlphaTrigger, BaseTrigger);

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

			console.log("WA result for " + question + " = " + JSON.stringify(result, null, 1));
			var primaryResult = that._getBestResult(result);
			if (primaryResult) {
				that._sendMessageAfterDelay(toId, primaryResult);
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
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}

WolframAlphaTrigger.prototype._getBestResult = function(result) {
	if (result) {
		// Look for primary result first
		for (var i=0; i < result.length; i++) {
			if (result[i].primary) {
				if (result[i].subpods[0].value) {
					return result[i].subpods[0].value;
				}
				else if (result[i].subpods[0].image) {
					return result[i].subpods[0].image;
				}
			}
		}

		// Otherwise just get the 2nd result (1st is the input interpretation)
		if (result.length > 1) {
			if (result[1].subpods[0].value) {
				return result[1].subpods[0].value;
			}
			else if (result[1].subpods[0].image) {
				return result[1].subpods[0].image;
			}
		}
	}
	return null;
}


exports.WolframAlphaTrigger = WolframAlphaTrigger;
WolframAlphaTrigger.prototype.getType = function() { return "WolframAlphaTrigger"; }
exports.triggerType = WolframAlphaTrigger.prototype.getType();
exports.create = function(name, chatBot, options) {
	var trigger = new WolframAlphaTrigger();
	trigger.init(name, chatBot, options);
	trigger.client = trigger.options.client || wolfram.createClient(trigger.options.appId);
	return trigger;
};
