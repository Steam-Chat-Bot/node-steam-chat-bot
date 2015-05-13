var util = require("util");
var request = require("request");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

var LinkName = function() {
	LinkName.super_.apply(this, arguments);
};

util.inherits(LinkName, BaseTrigger);

var type = "LinkName";
var re = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
var ln = "";

exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new LinkName(type, name, chatBot, options);

	trigger.respectsMute = true;
	trigger.respectsFilters = true;
	// Other initializers

	return trigger;
};

// Return true if a message was sent
LinkName.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

/*
LinkName.prototype._respond = function(toId, message) 
{
	var that = this;
	request(message, function (error, response, body) 
	{
		if (!error && response.statusCode == 200) 
		{
			var match = re.exec(body);
			if (match && match[2]) 
			{
				ln = "" + match[2];
				that._sendMessageAfterDelay(toId, ln)
				
			}
			
		}
	})
	
}*/
var splitmes;
LinkName.prototype._respond = function(toId, message) 
{
	var that = this;
	splitmes = message.split(" ");
	var i = 0;
	for (i = 0; i < splitmes.length; ++i)
	{
	request(splitmes[i], function (error, response, body) 
	{
		if (!error && response.statusCode === 200) 
		{
			var match = re.exec(body);
			if (match && match[2]) 
			{
				ln = "" + match[2];
				that._sendMessageAfterDelay(toId, ln)
				
			}
			
		}
	})
	}
}

