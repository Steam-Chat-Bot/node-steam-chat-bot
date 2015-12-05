var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that tells a user a random game from their games list (along with some other info). Requires a steam api key.
apikey - your steam api key. Can be alternatively defined for the bot globally as an option, steamapikey. Required for this plugin.
command - defaults to !randomgame
*/

var RandomGameTrigger = function() {
	RandomGameTrigger.super_.apply(this, arguments);
};

util.inherits(RandomGameTrigger, BaseTrigger);

var type = "RandomGameTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new RandomGameTrigger(type, name, chatBot, options);
		trigger.options.apikey = trigger.options.apikey || (chatBot.options.steamapikey || undefined);
		trigger.options.command = trigger.options.command || "!randomgame";
	return trigger;
};

// Return true if a message was sent
RandomGameTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
RandomGameTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

RandomGameTrigger.prototype._respond = function(roomId, userId, message) {
	var query = this._stripCommand(message);
	var steamId;
	if(query) {
		steamId = query.params[1] || userId;
		console.log(userId);
		var that = this;
		this.winston.info(this.chatBot.name+"/"+this.name+": Fetching a random game for " + steamId);
		var body;
		this.chatBot.steamApi('IPlayerService', 'GetOwnedGames', 1, 'get', this.options.apikey, {
			steamid: steamId,
			include_played_free_games: '1',
			include_appinfo: '1',
			json: 'true'
		}).then(function(value) {
			body = value;
			try {
				var game = body.response.games[Math.floor(Math.random()*body.response.game_count)];
				var time; //codacy annoying.
				if(!game.time||game.time===0)   { time = false;
				} else if (game.time<60)        { time = game.time + " minutes";
				} else if (game.time<1440)      { time = (game.time/60).toFixed(1) + " hours";
				} else if (game.time<10080)     { time = (game.time/1440).toFixed(1) + " days";
				} else if (game.time<43200)     { time = (game.time/10080).toFixed(1) + " weeks";
				} else { time = (game.time/43200).toFixed(1) + " months"; }
				that._sendMessageAfterDelay(roomId, game.name + ". Click steam://run/" + game.appid
					+ " to play it, or https://steamcommunity.com/app/" + game.appid + " to view the community page."
					+ (time ? " You have spent "+time+" playing it." : ""));
			}
			catch(e) {
				that.winston.error(that.chatBot.name+"/"+that.name+": ",e.stack);
			}
		}).catch(function(value) {
			that.winston.error(that.chatBot.name+"/"+that.name+": ",value);
		});
		return true;
	}
}

RandomGameTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
