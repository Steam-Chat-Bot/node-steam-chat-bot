var util = require('util');
var winston = require('winston');
var request = require('request');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var MediaWiki = require("mediawiki");
/*
Trigger that adds entries to igbWiki on command.
command = string - a message must start with this + a space before a response will be given
wikiUsername = string - the username for the bot on the wikiUsername.
wikiPassword = string - the password for the bot on the wiki.
useragent = string - the bot's useragent on the wiki. Defaults to "freakbot <https://igbwiki.com/wiki/User:freakbot>",
byeline = string - the bot's signature on pages it edits. Defaults to " - freakbot"
*/

var WikiBotTrigger = function() {
	WikiBotTrigger.super_.apply(this, arguments);
};

util.inherits(WikiBotTrigger, BaseTrigger);

var type = "WikiBotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new WikiBotTrigger(type, name, chatBot, options);
		trigger.options.endpoint = trigger.options.endpoint || "https://igbwiki.com/w/api.php";
		trigger.options.command = trigger.options.command || "!addpage";
		trigger.options.userAgent = trigger.options.userAgent || "freakbot <https://igbwiki.com/wiki/User:freakbot>";
		trigger.options.byeline = trigger.options.byeline || " - freakbot";
		trigger.options.rate = trigger.options.rate || 60e3 / 10;
		trigger.wikiBot = new MediaWiki.Bot({
			endpoint: trigger.options.endpoint,
			rate: trigger.options.rate,
			userAgent: trigger.options.userAgent,
			byeline: trigger.options.byeline
		});
//  trigger.options.isup = trigger.options.isup || isup;
	return trigger;
};
WikiBotTrigger.mediaWiki
// Return true if a message was sent
WikiBotTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
WikiBotTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

WikiBotTrigger.prototype._respond = function(toId, steamId, message) {
	var query = this._stripCommand(message);
	var that = this;
	if (query) {
		request.get({method:'GET',encoding:'utf8',uri:"http://store.steampowered.com/api/appdetails/?appids="+query,json:true,followAllRedirects:true}, function(error, response, body) {
			if (error) {
				try {
					winston.warn("Code " + response.statusCode + " from steam");
					that._sendMessageAfterDelay(roomId, "Code " + response.statusCode + " from steam");
				} catch (err) {winston.warn(err) }
				return;
			}
			info = body;
			//console.log(JSON.stringify(body));
			whoCalled = ((that.chatBot.steamClient.users && steamId in that.chatBot.steamClient.users) ? (that.chatBot.steamClient.users[steamId].playerName + "/"+steamId) : steamId);
			var result = that._getParsedResult(info, query, whoCalled);
			if (result) {
				// log in to the wiki
				that.wikiBot.login(that.options.wikiUsername, that.options.wikiPassword).complete(function (username) {
					console.log("Logged in as " + username);
					that._sendMessageAfterDelay(toId, "Logged in as " + username);
				}).error(function(err) {
					that._sendMessageAfterDelay(toId, "Error logging in: \n" + err);
					console.log("Error logging in:" + err);
				});
				that.wikiBot.edit(result.gamename, result.text, result.summary).complete(function (title, revision, date) {
					that._sendMessageAfterDelay(toId, "Revision #" + revision + " completed on " + title + " at " + date.toString() + ".\nPage created/updated for "+result.gamename);
					console.log("Revision #" + revision + " completed on " + title + " at " + date.toString() + ".\nPage created/updated for "+result.gamename);
				}).error(function(err) {
					that._sendMessageAfterDelay(toId, "Error submitting update: \n" + err);
					console.log("Error submitting update:" + err);
				});
				that.wikiBot.logout().complete(function () {
					that._sendMessageAfterDelay(toId, "Logged out!");
					console.log("Logged out!");
				}).error(function(err) {
					that._sendMessageAfterDelay(toId, "Error logging out: \n" + err);
					console.log("Error logging out: \n" + err);
				});
			}
		});
		return true;
	}
	return false;
}

WikiBotTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}
WikiBotTrigger.prototype._getParsedResult = function(input, query, who) {
	if (input && input[query] && input[query].success && input[query].success==true) {
		var game = input[query].data;
		var message={};
			message.text = "{{Game\n";
			message.text +=  (this._getExists(game.name)                  ? "|name = "        + game.name                  + "\n" : "");
			message.text +=  (this._getExists(game.developers)            ? "|dev = "         + game.developers.join(", ") + "\n" : "");
			message.text +=  (this._getExists(game.publishers)            ? "|pub = "         + game.publishers.join(", ") + "\n" : "");
			message.text +=  (this._getExists(game.website)               ? "|site = "        + game.website               + "\n" : "");
			message.text +=  (this._getExists(game.website)               ? "|sitename = Automatic Import - Unknown."      + "\n" : "");
			message.text +=  (this._getExists(game.steam_appid)           ? "|steam = "       + game.steam_appid           + "\n" : "");
			message.text +=  (this._getExists(game.price)		          ? "|price = "       + game.price.initial         + "\n" : "");
			message.text +=  (this._getExists(game.metacritic)            ? "|mc_score = "    + game.metacritic.score      + "\n" : "");
			message.text +=  (this._getExists(game.metacritic)            ? "|mc_url = "      + game.metacritic.url        + "\n" : "");
			message.text +=  (this._getExists(game.achievements.total)    ? "|chieves = "     + game.achievements.total    + "\n" : "");
			message.text +=  (this._getExists(game.release_date.date)     ? "|release = "     + game.release_date.date     + "\n" : "");
			message.text +=  (this._getExists(game.controller_support)    ? "|controller = "  + game.controller_support    + "\n" : "");
			message.text +=  (this._getExists(game.supported_languages)   ? "|languages = "   + game.supported_languages   + "\n" : "");
			message.text += "}}\n\n";
			message.text +=  (this._getExists(game.detailed_description)  ? "===Detailed Description===\n"    + game.detailed_description  + "\n\n" : "");
//			message.text +=  (this._getExists(game.about_the_game)        ? "===About The Game===\n"          + game.about_the_game        + "\n\n" : "");
			message.appid = game.steam_appid;
			message.gamename = game.name.split(" ").join("_");
			message.summary = "Bot import of info for "+game.name+" initiated by "+who+".";
			console.log("message: "+JSON.stringify(message));
		return message;
	}
	return null;
}
WikiBotTrigger.prototype._getExists = function(input) {
	if(input==false) return false;
	else if(input==undefined) return false;
	else if(input==0) return false;
	else if(input=="") return false;
	else return true;
}
