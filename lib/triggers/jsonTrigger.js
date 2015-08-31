var util = require("util");
var request = require("request");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that fetches some json from a web service and returns part of it.
url = string - the url of the web service
url = function(userId, roomId, message, trigger) - a function that creates the url.
	If you want to add the user's profile name, etc.
	roomId = userId if sent in private.
	The trigger allows access to the trigger constructor
		(trigger.name, trigger.options, trigger.chatBot, trigger._sendMessageAfterDelay may be useful).
	function(u,r,m,t){return "http://api.icndb.com/jokes/random/"+t._stripCommand(m)}
	function(u,r,m,t){return "http://steamcommunity.com/profiles/"+u+"?xml=1";}
parser = function(data, userId, roomId, message, trigger) - A function to parse the results and return the correct data (or none at all if you send the message yourself).
	if results are {"value": { "joke": "iwantthis" } }, the following are the same:
		function(d,a,b,c,t){return d.value.joke}
		function(d, u, r, m, t){t._sendMessageAfterDelay(d.value.joke); return false}
parser = array - an array listing how to parse the object {"value": { "joke": "iwantthis" } } = ["value","joke"]
	data returned by either parser will be imediately sent. Don't make further requests or other async.
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
		trigger.options.json = trigger.options.json === false ? false : true;
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
	if(this._stripCommand(message) && this.options.url && (this.options.parser instanceof Array || typeof this.options.parser==="function")) {
		var fullurl;
		if(typeof this.options.url==="function") {
			fullurl = this.options.url(userId, toId, message, this);
		} else if(typeof this.options.url === "string") {
			fullurl = this.options.url;
		} else {
			return false;
		}
		var that = this;
		try {
			request.get({method:"GET",encoding:"utf8",uri:fullurl,json:that.options.json||true,followAllRedirects:true}, function(error, response, body) {
				if (error) {
					that._sendMessageAfterDelay(toId, "Error obtaining data.");
					that.winston.warn(that.chatBot.name+"/"+that.name+": Code " + response.statusCode + " error obtaining data");
					return;
				}
				var result = body;
				if(body) {
					try {
						if(that.options.parser instanceof Array) {
							for(var a=0;a<that.options.parser.length;a++) {
								result = result[that.options.parser[a]];
							}
							that._sendMessageAfterDelay(toId, result);
						} else if(typeof that.options.parser === "function") {
							result = that.options.parser(result, userId, toId, message, that);
							if(result && result !== true) {
								that._sendMessageAfterDelay(result);
							}
						}
					} catch(err) {
						that._sendMessageAfterDelay(toId, "An error has been logged");
						that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
					}
				}
				else {
					that._sendMessageAfterDelay(toId, "The request completed successfully, but I received no data!");
				}
			});
		} catch(err) {
			that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
			that._sendMessageAfterDelay(toId, "Error fetching data.");
		} return true;
	} return false;
}

JsonTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
		return true;
	}
	return null;
}
