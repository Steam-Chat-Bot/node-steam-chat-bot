var util = require("util");
var request = require("request");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that responds to requests and tells if a server is running
see http://technotip.com/3709/server-up-or-down-node-js/ for more info
command = string - a message must start with this + a space before a response will be given
*/

var IsUpTrigger = function() {
	IsUpTrigger.super_.apply(this, arguments);
};

util.inherits(IsUpTrigger, BaseTrigger);

var type = "IsUpTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new IsUpTrigger(type, name, chatBot, options);

	trigger.options.command = trigger.options.command || "!isup";
//	trigger.options.isup = trigger.options.isup || isup;
	return trigger;
};

// Return true if a message was sent
IsUpTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
IsUpTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

IsUpTrigger.prototype._respond = function(toId, message) {
	var query = this._stripCommand(message);
	var that = this;
	if (query) {
		if(query.indexOf("://") === -1) {
			query = "http://" + query;
		}
		try {
			request(query, function (error, response, body) {
				if (!error) {
					if(response.statusCode===200 || response.statusCode===301) {
						that._sendMessageAfterDelay(toId, "It's working just fine for me.");
					} else {
						that._sendMessageAfterDelay(toId, "The server is running, but it returned http status code "+ response.statusCode+". Please look it up for more information.");
					}
				} else {
					that.winston.warn(that.chatBot.name+"/"+that.name+": ERROR! " + error);
					try{ that._sendMessageAfterDelay(toId, "ERROR! Please notify the bot admin to check the logs!");
					} catch(e) { that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",e.stack); that._sendMessageAfterDelay(toId, "ERROR!"); }
				}
			});
			return true;
		} catch(e) { that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",e.stack); }
	}
	return false;
}

IsUpTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}
