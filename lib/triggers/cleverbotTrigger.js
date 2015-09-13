var util = require("util");
var Cleverbot = require("cleverbot-node");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that responds to messages using cleverbot.
keywords = array of string - if this option exists, the message must contain one of these words to trigger a response

cleverbot = Cleverbot object - use this as the cleverbot if it is passed as an option
OR
session = string - construct a new cleverbot with this session (or no session if this is not specified)
*/

var CleverbotTrigger = function() {
	CleverbotTrigger.super_.apply(this, arguments);
};

util.inherits(CleverbotTrigger, BaseTrigger);

var type = "CleverbotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new CleverbotTrigger(type, name, chatBot, options);

	if (trigger.options.cleverbot) {
		trigger.cleverbot = trigger.options.cleverbot;
	} else {
		trigger.cleverbot = new Cleverbot();
		if (trigger.options.session) {
			this.winston.info(this.chatBot.name+"/"+this.name+": Setting Cleverbot session: " + trigger.options.session);
			trigger.cleverbot.params.sessionid = trigger.options.session;
		}
	}
	return trigger;
};

// Return true if a message was sent
CleverbotTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
CleverbotTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}


CleverbotTrigger.prototype._respond = function(toId, message) {
	message = this._stripMessage(message);
	if (message) {
		this.winston.debug(this.chatBot.name+"/"+this.name+": Sending cleverbot request with params:",this.cleverbot.params);
		var that = this;

		Cleverbot.prepare(function() {
			that.cleverbot.write(message, function(response) {
				that.winston.debug(that.chatBot.name+"/"+that.name+": Cleverbot responded with params:",that.cleverbot.params);
				if (response.message !== '<html>' && response.message.trim() !== '' && response.message.indexOf("Error:") !== 0) {
					that._sendMessageAfterDelay(toId, response.message.trim());
				}
			});
		});

		return true;
	}
	return false;
}

CleverbotTrigger.prototype._stripMessage = function(message) {
	if (!this.options.keywords || this.options.keywords.length === 0) {
		return true; // Match all
	}

	for (var i=0; i < this.options.keywords.length; i++) {
		var re = new RegExp("^.*\\b" + this.options.keywords[i] + "\\b.*$", "i");
		var matches = message.match(re);
		if (matches && matches.length > 0) {
			message = message.replace(this.options.keywords[i], "");
			if (message.trim()) {
				return message;
			}
			else {
				return null;
			}
		}
	}
	return null;
}
