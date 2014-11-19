var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that matches a regex and responds with a message that possibly contains matched regex groups
match = regex - the message to match, must be exact
response = string - response, possibly including wildcards of the form {0}, {1}, etc as placeholders for the matched regex group
*/

var RegexReplaceTrigger = function() {
	RegexReplaceTrigger.super_.apply(this, arguments);
};

util.inherits(RegexReplaceTrigger, BaseTrigger);

var type = "RegexReplaceTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new RegexReplaceTrigger(type, name, chatBot, options);
	return trigger;
};


// Return true if a message was sent
RegexReplaceTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
RegexReplaceTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}


RegexReplaceTrigger.prototype._respond = function(toId, message) {
	if (this._messageTriggers(message)) {
		var response = this._substituteWildcards(message);
		this._sendMessageAfterDelay(toId, response);
		return true;
	}
	return false;
}

RegexReplaceTrigger.prototype._messageTriggers = function(message) {
	if (!this.options.match) { return false; }

	var matches = message.toLowerCase().match(this.options.match);
	return matches !== null && matches.length > 0;
}

RegexReplaceTrigger.prototype._substituteWildcards = function(message) {
	var formattedResponse = this.options.response;
	var matches = message.toLowerCase().match(this.options.match);
	for (var i=1; i < matches.length; i++) {
		formattedResponse = formattedResponse.replace("{" + (i-1) + "}", matches[i]);
	} 
	return formattedResponse;
}
