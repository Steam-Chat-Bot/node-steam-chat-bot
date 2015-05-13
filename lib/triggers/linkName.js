var util = require("util");
var request = require("request");

/*
Looks for links in chatrooms, then responds with the linked page title.
Useful for youtube links. Works on everything else too.
*/

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

var LinkName = function() {
	LinkName.super_.apply(this, arguments);
};

util.inherits(LinkName, BaseTrigger);

var type = "LinkName";
var re = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
var ln = "";
var splitmes;

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


LinkName.prototype._respond = function(toId, message) 
{
	var that = this;
	//split the chat message into an array.
	//without checking every word for a link, it skips messages that contain words along with a link
	splitmes = message.split(" ");
	//check each word to see it it's a link
	for (i = 0; i < splitmes.length; ++i)
	{
	request(splitmes[i], function (error, response, body) 
	{
		if (!error && response.statusCode == 200) 
		{
			//if it is a link, split around the <title> mark to get the page title
			var match = re.exec(body);
			if (match && match[2]) 
			{
				ln = "" + match[2];
				//finally send the title as a message into chat
				that._sendMessageAfterDelay(toId, ln)
				
			}
			
		}
	})
	}
}

