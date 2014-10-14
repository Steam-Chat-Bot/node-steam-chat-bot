var util = require('util');
var request = require('request');
var winston = require('winston');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var TinyCache = require( 'tinycache' );
var cache = new TinyCache();
/*
Trigger that fetches some json from a web service and returns part of it.
url = string - the url of the web service
url = function(userId, roomId, message) - a function that creates the url. If you want to add the user's profile name, etc. roomId = userId if sent in private.
parser = function(data, userId, roomId, message) - A function to parse the results and return the correct data. if results are {"value": { "joke": "iwantthis" } } = function(data){return data.value.joke}
parser = array - an array listing how to parse the object {"value": { "joke": "iwantthis" } } = ['value','joke']
json = bool - Should we set json:true in the header (defaults to true)
*/

var JsonTrigger = function() {
	JsonTrigger.super_.apply(this, arguments);
};

util.inherits(JsonTrigger, BaseTrigger);

var type = "JsonTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new JsonTrigger(type, name, chatBot, options);
		trigger.options.json = trigger.options.json || true;
	return trigger;
}

// Return true if a message was sent
JsonTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
JsonTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(chatterId, roomId, message);
}

JsonTrigger.prototype._respond = function(userId, toId, message) {
	var fullurl;
	if(typeof this.options.url==='function')
		fullurl = this.options.url(userId, toId, message);
	else if(typeof fullurl === 'string') fullurl = string;
	else return false;
	if(this._stripCommand(message) && this.options.url && this.options.format && (typeof this.options.parser==Array || typeof this.options.parser=="function")) {
		var that = this;
		try {
			request.get({method:'GET',encoding:'utf8',uri:fullurl,json:that.options.json||true,followAllRedirects:true}, function(error, response, body) {
				if (error) {
					that._sendMessageAfterDelay(toId, "Error obtaining data.");
					winston.warn("Code " + response.statusCode + " error obtaining data");
					return;
				}
				var result = body;
				if(body) {
					try {
						if(that.options.parser instanceof array) {
							for(a=0;a<that.options.parser.length;a++) result = result[that.options.parser[a]];
							that._sendMessageAfterDelay(toId, result);
						} else if(typeof that.options.parser === "function") {
							that._sendMessageAfterDelay(that.options.parser(result, userId, roomId, message));
						}
					} catch(err) {
						that._sendMessageAfterDelay(toId, "An error has been logged");
						that.chatBot.log.error(err.stack);
					}
				}
				else {
					that._sendMessageAfterDelay(toId, "The request completed successfully, but I received no data!");
				}
			});
		} catch(err) {
			that.chatBot.log.error(that.name+": "+err.stack);
			that._sendMessageAfterDelay(toId, "Error fetching data.");
		} return true;
	} return false;
}

JsonTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) == 0) {
		return true;
	}
	return null;
}
