var util = require("util");
var request = require("request");
var ent = require('html-entities').AllHtmlEntities;
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
When a url is posted, the bot will try to connect to urls and provide a page title. (Actually, it treats all space-separated group of characters as a url)
command = string - a message must start with this + a space before a response will be given.
valid = string - if the string value doesn't appears in the URL, it won't be checked (ie, 'steamcommunity.com'). Protocol is not needed.
valid = array[string] - for multiple strings, used as above
valid = function(link) - for custom validation (ie, regex). Function validates individual links, not entire lines. If functions returns true, trigger will attempt to grab a name. For example: function(link) { if(link.indexOf('steam')>-1) {return true} }
*/

var LinkNameTrigger = function() {
	LinkNameTrigger.super_.apply(this, arguments);
};

util.inherits(LinkNameTrigger, BaseTrigger);

var type = "LinkNameTrigger";

exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new LinkNameTrigger(type, name, chatBot, options);
	trigger.options.valid = options.valid || false;
	trigger.options.validateBysubstring = options.validateBysubstring || false;
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
	for (var i = 0; i < splitmes.length; ++i) {
		if(that.options.valid && !that._validate(splitmes[i])) {
			continue; //skip to next token
		}
		//if this part of the message is a link
		request(splitmes[i], function (error, response, body) {
			if (!error && response.statusCode === 200) {
				//split at <title>
				var match = re.exec(body);
				if (match && match[2]) {
					//send title message
					var ln = "" + match[2];
					that._sendMessageAfterDelay(toId, ent.decode(ln));
				}
				match = re.exec(body);
			}
		});
	}
}
LinkNameTrigger.prototype._validate = function(input) {
	if(this.options.valid instanceof Array) {
		for(var j=0; j<this.options.valid; j++) {
			if(input.indexOf(j) > -1) { return true; }
		}
	} else if (this.options.valid instanceof Function && this.options.valid(input)) {
		return true;
	} else if (typeof this.options.valid === "string" && input.indexOf(this.options.valid) > -1) {
		return true;
	}
	return false;
}
