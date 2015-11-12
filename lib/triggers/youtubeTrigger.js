var util = require("util");
var youtube = require('youtube-api');

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that responds to messages with the first matching YouTube search result.
command = string - a message must start with this + a space before a response will be given
rickrollChance = float - a probability (between 0 and 1) that the trigger will respond with a rickroll
apikey = api key, get from here: https://console.developers.google.com
*/

var YoutubeTrigger = function() {
	YoutubeTrigger.super_.apply(this, arguments);
};

util.inherits(YoutubeTrigger, BaseTrigger);

exports.RickrollUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

var type = "YoutubeTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new YoutubeTrigger(type, name, chatBot, options);
	trigger.options.command = trigger.options.command || "!yt";
	trigger.options.apikey = trigger.options.apikey || undefined;
	//trigger.options.youtube = trigger.options.youtube || youtube;

	return trigger;
};

// Return true if a message was sent
YoutubeTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
YoutubeTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

YoutubeTrigger.prototype._respond = function(toId, message) {
	var query = this._stripCommand(message);

	if (query) {

		var remove = [];
		for(var i = 1; i < query.params.length; i++) {
			remove.push(query.params[i]);
		}

		if (this._shouldRickroll()) {
			this._sendMessageAfterDelay(toId, 'Video: ' + exports.RickrollUrl);
			return true;
		}

		var that = this;

		youtube.authenticate({
			type: "key",
			key: that.options.apikey
		});

		var videoUrl = 'https://youtube.com/watch?v=';
		var channelUrl = 'https://youtube.com/channel/';

		youtube.search.list({
			"part": 'snippet',
			"maxResults": 1,
			"q": remove.toString()
		}, function(err, data) {
			if(err) { that.winston.error(err); that._sendMessageAfterDelay(toId, 'Error: ' + err.message + ' (' + err.code + ')'); }
			else {
				if(data.items[0] === undefined) {
					that._sendMessageAfterDelay(toId, 'I did not receive a result from youtube.');
				}
				else if(data.items[0].id.kind === 'youtube#channel') {
					that._sendMessageAfterDelay(toId, 'Channel: ' + channelUrl + data.items[0].id.channelId);
				}
				else if(data.items[0].id.kind === 'youtube#video') {
					that._sendMessageAfterDelay(toId, 'Video: ' + videoUrl + data.items[0].id.videoId);
				}
			}
		});

		return true;
	}
	return false;
}

YoutubeTrigger.prototype._shouldRickroll = function() {
	if (this.options.rickrollChance) {
		var random = Math.random();
		return random < this.options.rickrollChance;
	}
	return false;
}

YoutubeTrigger.prototype._stripCommand = function(message, command) {
	if (command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	else if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
