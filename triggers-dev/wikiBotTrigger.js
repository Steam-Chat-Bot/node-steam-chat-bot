var util = require('util');
var winston = require('winston');
var request = require('request');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var nodemw = require('nodemw');
/*
Trigger that adds entries to igbWiki on command.
server = string - what wiki server is the bot supposed to connect to? defaults to IGBWikicommand
path = string - path to api.php. defaults to /w
debug = bool - more output. defaults to false;
command = string - a message must start with this + a space before a response will be given
wikiUsername = string - the username for the bot on the wikiUsername.
wikiPassword = string - the password for the bot on the wiki.
userAgent = string - the bot's useragent on the wiki. Defaults to "freakbot <https://igbwiki.com/wiki/User:freakbot>",
byeline = string - the bot's signature on pages it edits. Defaults to " - freakbot"
concurrency = int - the number of API requests that the bot can run in parallel
categories = string, array[string,string] - category name (or array of categories) to add edited articles to. Defaults to Incomplete; artciles created by the bot will only have information on the game itself, not what bundles it was in, etc.
*/

var WikiBotTrigger = function() {
	WikiBotTrigger.super_.apply(this, arguments);
};

util.inherits(WikiBotTrigger, BaseTrigger);

var type = "WikiBotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new WikiBotTrigger(type, name, chatBot, options);
		trigger.options.server      = trigger.options.server || "igbwiki.com"; //server
		trigger.options.path        = trigger.options.path || "/w" //path to api.php
		trigger.options.debug       = trigger.options.debug || false;
		trigger.options.command     = trigger.options.command || "!addpage";
		trigger.options.userAgent   = trigger.options.userAgent || "freakbot <https://igbwiki.com/wiki/User:freakbot>";
		trigger.options.byeline     = trigger.options.byeline || " - freakbot";
		trigger.options.concurrency = trigger.options.concurrency || 3;
		trigger.options.categories  = trigger.options.categories || "Incomplete";
		trigger.wikiBot = new nodemw({
			server: trigger.options.endpoint,
			path: trigger.options.path,
			debug: trigger.options.debug,
			username: trigger.options.wikiUsername,
			password: trigger.options.wikiPassword,
			userAgent: trigger.options.userAgent,
			concurrency: trigger.options.concurrency
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
	var query = this._stripCommand(message, this.options.commandImport);
	if (query) {
		this._importGames(toId,steamId,query);
		return true;
	}
	return false;
}

WikiBotTrigger.prototype._importGames = function(toId,steamId,query) {
	var that = this;
	request.get({method:'GET',encoding:'utf8',uri:"http://store.steampowered.com/api/appdetails/?appids="+query,json:true,followAllRedirects:true}, function(error, response, body) {
		if (error) {
			try {
				winston.warn("Code " + response.statusCode + " from steam");
				that._sendMessageAfterDelay(roomId, "Code " + response.statusCode + " from steam");
			} catch (err) {winston.warn(err) }
			return;
		}
		var info = body;
		//winston.log(JSON.stringify(body));
		whoCalled = ((that.chatBot.steamClient.users && steamId in that.chatBot.steamClient.users) ? (that.chatBot.steamClient.users[steamId].playerName + "/"+steamId) : steamId);
		try { that.wikiBot.login(function(data){
			if(data.result!="Success") {
				that.logInfo(toId,steamId,"Failure logging in" + (data.result ? ": " + data.result : ""));
				throw new Error("Failure logging in" + (data.result ? ": " + data.result : ""));
			}
			that.logInfo(toId,steamId,"Logged in as " + data.lgusername);
			//Parse through the various appids and edit each page
			for (var key in info) {
				that._getParsedResult(body[key], whoCalled);
				that.wikiBot.edit(result.gamename, result.text, result.summary, function(editdata){
					if(editdata.result=="Success") that.logInfo(toId,steamId,editdata.title+" Revision #" + editdata.newrevid + " completed at " + editdata.newtimestamp + ".\nPage " + (data.oldrevid==0 ? "created" : "updated") +" for "+result.gamename);
					else that.logInfo(toId,steamId, "Edit fail for "+result.gamename+". Logging out.",{level:warn,data:JSON.stringify(editdata)})
				});
			}
			that.wikiBot.logout().complete(function () {
				that.logInfo(toId,steamId, "Logged out!");
			});
		});} catch (err) {
			that.logInfo(toId,steamId,"Failure",{level:"error",err:err});
		}
	});
}
WikiBotTrigger.prototype._stripCommand = function(message, cmd) {
	if(cmd) var command = cmd;
	else var command = this.options.command;
	if(typeof command==="string" && message && (message.toLowerCase().indexOf(command.toLowerCase()+" ")||message.toLowerCase().indexOf(command.toLowerCase()+"\n")) == 0)
		return message.substring(command.length + 1);
	return null;
}
WikiBotTrigger.prototype._getParsedResult = function(game, who) {
	if (input.success==true) {
		var message = { success:true };
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
			message.appid = game.steam_appid;
			message.gamename = game.name.split(" ").join("_");
			message.summary = "Bot import of info for "+game.name+" initiated by "+who+"."+this.options.byeline;
			
			if(this.options.categories && Array.isArray(this.options.categories)){
				message.text+="\n";
				this.options.categories.forEach(function(entry){
					message.text+="[[Category:"+entry+"]]";
				});
			} else if (this.options.categories && typeof this.options.categories==="string") {
				message.text+="[[Category:"+this.options.categories+"]]";
			}
			//winston.log("message: "+JSON.stringify(message));
		return message;
	}
	return game;
}

WikiBotTrigger.prototype._getExists = function(input) {
	if(input==false) return false;
	else if(input==undefined) return false;
	else if(input==0) return false;
	else if(input=="") return false;
	else return true;
}
WikiBotTrigger.prototype._logInfo = function(roomId,chatterId,info,extra) { //send messages to pm if muted or not at all if necessary, display extra error information in log
	if(!extra || extra.nowho==false) {
		var message = info;
		if(extra && extra.err) message+="\nAdditional error information has been logged.";
		if(this.chatBot.muted==false) that._sendMessageAfterDelay(roomId, message);
		else that._sendMessageAfterDelay(chatterId,message);
	} else if(!extra || extra.nolog!=true) {
		var loginfo = info;
		if(extra.data) loginfo += "\n" + extra.data;
		if(extra.err)  loginfo += "\n" + extra.err.message + "\n" + extra.err.stack;
		else if(extra.error)  loginfo += "\n" + extra.error.message + "\n" + extra.error.stack;
		
		if(extra.level=="warn") winston.warn(loginfo);
		else if (extra.level=="err" || extra.level=="error") winston.err(loginfo);
		else winston.log(loginfo);
	}
}
