var util = require('util');
var request = require('request');
var winston = require('winston');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that looks words up on urban dictionary on command.
command = string - a message must start with this + a space before a response will be given
responses = integer - the number of definitions to get. Defaults to 1.
*/

var UrbanDictionaryTrigger = function() {
	UrbanDictionaryTrigger.super_.apply(this, arguments);
};

util.inherits(UrbanDictionaryTrigger, BaseTrigger);

var type = "UrbanDictionaryTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new UrbanDictionaryTrigger(type, name, chatBot, options);
	return trigger;
};

// Return true if a message was sent
UrbanDictionaryTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
UrbanDictionaryTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}


UrbanDictionaryTrigger.prototype._respond = function(toId, message) {
	var term = this._stripCommand(message);
	var that = this;
    if (term) {
        request({method:'GET',encoding:'utf8',uri:'http://api.urbandictionary.com/v0/define?term='+encodeURI(term),json:true,followAllRedirects:true}, function(error, response, body) {
			if (error) {
				winston.warn("Code " + response.statusCode + " from Urban Dictionary for " + term);
				that._sendMessageAfterDelay(toId, "¯\\_(ツ)_/¯");
				return;
			}
			if (!error && response.statusCode == 200) {
					var definitions=body;
					var result = that._getParsedResult(definitions);
					if(result)
						that._sendMessageAfterDelay(toId, result);
					else that._sendMessageAfterDelay(toId, "¯\\_(ツ)_/¯");
            }
        });
        return true;
    }
    return false;
}

UrbanDictionaryTrigger.prototype._getParsedResult = function(message) {
    var replies=[];
    if(message && message.result_type=='exact' && message.list)
        for(i=0;i<(this.options.results ? (this.options.results < message.list.length ? this.options.results : message.list.length) : 1);i++) {
            replies[i] = ((this.options.results ? (this.options.results < message.list.length ? this.options.results : message.list.length) : 1) > 1 ? i+" - " : "");
            replies[i]+= message.list[i].word + ": " + message.list[i].definition + (message.list[i].example ? "\r\nExample:\r\n"+message.list[i].example : "");
        }
    return replies.join("\r\n---Definition---\r\n");
}

UrbanDictionaryTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0)
		return message.substring(this.options.command.length + 1);
	return null;
}
