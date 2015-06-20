var util = require("util");
var request = require("request");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

var LinkNameTrigger = function() {
	LinkNameTrigger.super_.apply(this, arguments);
};

util.inherits(LinkNameTrigger, BaseTrigger);

var type = "LinkNameTrigger";

exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new LinkNameTrigger(type, name, chatBot, options);

	trigger.respectsMute = true;
	trigger.respectsFilters = true;
	// Other initializers

	return trigger;
};
// Return true if a message was sent
LinkNameTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}
// Return true if a message was sent
LinkNameTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

LinkNameTrigger.prototype._respond = function(toId, message) {
	var that = this;
	//split the message into words. Without it, this omits all messages that include words together with links.
	var re = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
	var splitmes = message.split(" ");
	var i = 0;
	for (i = 0; i < splitmes.length; ++i) {
		//if this part of the message is a link
		request(splitmes[i], function (error, response, body) {
			if (!error && response.statusCode === 200) {
				//split at <title>
				var match = re.exec(body);
				if (match && match[2]) {
					//send title message
					var ln = "" + match[2];
					that._sendMessageAfterDelay(toId, ln);
				}
				match = re.exec(body);
			}
		});
	}
}
