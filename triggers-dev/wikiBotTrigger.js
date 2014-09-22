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
cmdImport = string - Command to import a page with info from steam api. Input a single appid or comma-separated list. Default !import
cmdEdit = string - Command to edit a page. Defaults to !edit
cmdMove = string - Command to move a page. Defaults to !move
cmdDel = string - Command to delete a page. Defaults to !del
wikiUsername = string - the username for the bot on the wikiUsername.
wikiPassword = string - the password for the bot on the wiki.
userAgent = string - the bot's useragent on the wiki. Defaults to "freakbot <https://igbwiki.com/wiki/User:freakbot>",
byeline = string - the bot's signature on pages it edits. Defaults to " - freakbot"
concurrency = int - the number of API requests that the bot can run in parallel
categories = string, array[string,string] - category name (or array of categories) to add to imported articles. Defaults to Incomplete; articles created by the bot will only have information on the game itself, not what bundles it was in, etc.
*/

var WikiBotTrigger = function() {
	WikiBotTrigger.super_.apply(this, arguments);
};

util.inherits(WikiBotTrigger, BaseTrigger);

var type = "WikiBotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new WikiBotTrigger(type, name, chatBot, options);
		trigger.options.server      = trigger.options.server      || "igbwiki.com"; //server
		trigger.options.path        = trigger.options.path        || "/w"; //path to api.php
		trigger.options.debug       = trigger.options.debug       || false;
		trigger.options.cmdImport   = trigger.options.cmdImport   || "!import";
		trigger.options.cmdEdit     = trigger.options.cmdEdit     || "!edit";
		trigger.options.cmdMove     = trigger.options.cmdMove     || "!move";
		trigger.options.cmdDel      = trigger.options.cmdDel      || "!del";
		trigger.options.userAgent   = trigger.options.userAgent   || "freakbot <https://igbwiki.com/wiki/User:freakbot>";
		trigger.options.byeline     = trigger.options.byeline     || " - freakbot";
		trigger.options.concurrency = trigger.options.concurrency || 3;
		trigger.options.categories  = trigger.options.categories  || "Incomplete";
		trigger.wikiBot = new nodemw({
			server: trigger.options.server,
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
// Return true if a message was sent
WikiBotTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
WikiBotTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

WikiBotTrigger.prototype._respond = function(toId, steamId, message) {
	var query = this._stripCommand(message, this.options.cmdImport);
	if (query) {
		this._importGames(toId,steamId,query);
		return true;
	}
	query = this._stripCommand(message, this.options.cmdEdit);
	if(query) {
		this._editPage(toId,steamId,query);
		return true;
	}
	query = this._stripCommand(message, this.options.cmdMove);
	if(query) {
		this._movePage(toId,steamId,message);
		return true;
	}
	query = this._stripCommand(message, this.options.cmdDel);
	if(query) {
		this._deletePage(toId,steamId,message);
		return true;
	}
	return false;
}

WikiBotTrigger.prototype._deletePage = function(toId,steamId,message) {
	var whoCalled = ((this.chatBot.steamClient.users && steamId in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[steamId].playerName + "/"+steamId) : steamId);
	var params = message.split("||");
	if(params.length < 1) this._logInfo(toId, steamId, "You need to specify the following: \"" +this.options.commandMove+" pagename[||reason]\"");
	var page = params[0];
	var reason = whoCalled + " is deleting this page " (params[1] ? "because: " + params[1] : "") + this.options.byeline;
	try { that.wikiBot.logIn(function(data){
		if(data.result!="Success") {
			that._logInfo(toId,steamId,"Failure logging in" + (data.result ? ": " + data.result : ""));
			throw new Error("Failure logging in" + (data.result ? ": " + data.result : ""));
		}
		that._logInfo(toId,steamId,"Logged in as " + data.lgusername);
		that.wikiBot.delete(page, reason, function(editdata){
			if(editdata.result=="Success") that._logInfo(toId,steamId,editdata.title+" Revision #" + editdata.newrevid + " completed at " + editdata.newtimestamp+". "+page+" deleted.");
			else that._logInfo(toId,steamId, "Failed to delete "+page+".",{level:error,data:JSON.stringify(editdata)});
		});
	})} catch (err) {
		that._logInfo(toId,steamId,"Failure",{level:"error",err:err});
	}
}

WikiBotTrigger.prototype._movePage = function(toId,steamId,message) {
	var whoCalled = ((this.chatBot.steamClient.users && steamId in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[steamId].playerName + "/"+steamId) : steamId);
	var params = message.split("||");
	if(params.length < 2) this._logInfo(toId, steamId, "You need to specify the following: \"" +this.options.commandMove+" OldName||NewName[||Summary]\"");
	var from = params[0];
	var to = params[1];
	var summary = whoCalled+" is moving this page "+(params[2] ? " because: "+params[2]: "") + "."+this.options.byeline;
	try { that.wikiBot.logIn(function(data){
		if(data.result!="Success") {
			that._logInfo(toId,steamId,"Failure logging in" + (data.result ? ": " + data.result : ""));
			throw new Error("Failure logging in" + (data.result ? ": " + data.result : ""));
		}
		that._logInfo(toId,steamId,"Logged in as " + data.lgusername);
		that.wikiBot.move(from, to, summary, function(editdata){
			if(editdata.result=="Success") that._logInfo(toId,steamId,editdata.title+" Revision #" + editdata.newrevid + " completed at " + editdata.newtimestamp+". "+from+" moved to "+to+".");
			else that._logInfo(toId,steamId, "Failed to move "+from+" to "+to+".",{level:error,data:JSON.stringify(editdata)});
		});
	})} catch (err) {
		that._logInfo(toId,steamId,"Failure",{level:"error",err:err});
	}
}

WikiBotTrigger.prototype._editPage = function(toId,steamId,query) {
	var whoCalled = ((this.chatBot.steamClient.users && steamId in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[steamId].playerName + "/"+steamId) : steamId);
	var lines = query.split("\n");
	var summary = (lines[lines.length-1].toLowerCase().indexOf("summary: ") == 0 ? true : false);
	summary = whoCalled+" is editing this page " + (summary ? "because "+lines.pop().substring(9): "") +this.options.byeline;
	var articlename = lines.shift();
	if(lines.length < 2) {
		that._logInfo(toId,steamId,"You need to include an article title on the first line, content, and optionally a summary in the last line, prefixed with \"summary: \"");
		return;
	}
	var that = this;
	try { that.wikiBot.logIn(function(data){
		if(data.result!="Success") {
			that._logInfo(toId,steamId,"Failure logging in" + (data.result ? ": " + data.result : ""));
			throw new Error("Failure logging in" + (data.result ? ": " + data.result : ""));
		}
		that._logInfo(toId,steamId,"Logged in as " + data.lgusername);
		that.wikiBot.edit(articlename, lines.join("\n"), summary, function(editdata){
			if(editdata.result=="Success") that._logInfo(toId,steamId,editdata.title+" Revision #" + editdata.newrevid + " completed at " + editdata.newtimestamp + ". Page " + (data.oldrevid==0 ? "created" : "updated") +" for "+articlename);
			else that._logInfo(toId,steamId, "Edit fail for "+result.gamename+".",{level:error,data:JSON.stringify(editdata)});
		});
	})} catch (err) {
		that._logInfo(toId,steamId,"Failure",{level:"error",err:err});
	}
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
		try { that.wikiBot.logIn(function(data){
			if(data.result!="Success") {
				that._logInfo(toId,steamId,"Failure logging in" + (data.result ? ": " + data.result : ""));
				throw new Error("Failure logging in" + (data.result ? ": " + data.result : ""));
			}
			that._logInfo(toId,steamId,"Logged in as " + data.lgusername);
			//Parse through the various appids and edit each page
			for (var key in info) {
				var result = that._getParsedResult(body[key], whoCalled);
				if(result.success) {
					that.wikiBot.edit(result.gamename, result.text, result.summary, function(editdata){
						if(editdata.result=="Success") that._logInfo(toId,steamId,editdata.title+" Revision #" + editdata.newrevid + " completed at " + editdata.newtimestamp + ". Page " + (data.oldrevid==0 ? "created" : "updated") +" for "+result.appid+"/"+result.gamename);
						else that._logInfo(toId,steamId, "Edit fail for "+result.gamename,{level:error,data:JSON.stringify(editdata)});
					});
				} else {
					that._logInfo(toId,steamId, "Edit fail for "+key+". "+key+" is not a valid appId.");
				}
			}
		});} catch (err) {
			that._logInfo(toId,steamId,"Failure",{level:"error",err:err});
		}
	});
}
WikiBotTrigger.prototype._stripCommand = function(message, cmd) {
	if(cmd) var command = cmd;
	else var command = this.options.command;
	if(typeof command==="string" && message && (message.toLowerCase().indexOf(command.toLowerCase()+" ")==0||message.toLowerCase().indexOf(command.toLowerCase()+"\n"==0) == 0))
		return message.substring(command.length + 1);
	return null;
}
WikiBotTrigger.prototype._getParsedResult = function(game, who) {
	if (game.success==true && game.data) {
		var message = { success:true };
			message.text = "{{Game\n";
			message.text +=  (this._getExists(game.data.name)                  ? "|name = "        + game.data.name                  + "\n" : "");
			message.text +=  (this._getExists(game.data.developers)            ? "|dev = "         + game.data.developers.join(", ") + "\n" : "");
			message.text +=  (this._getExists(game.data.publishers)            ? "|pub = "         + game.data.publishers.join(", ") + "\n" : "");
			message.text +=  (this._getExists(game.data.website)               ? "|site = "        + game.data.website               + "\n" : "");
			message.text +=  (this._getExists(game.data.website)               ? "|sitename = Automatic Import - Unknown."      + "\n" : "");
			message.text +=  (this._getExists(game.data.steam_appid)           ? "|steam = "       + game.data.steam_appid           + "\n" : "");
			message.text +=  (this._getExists(game.data.price)		          ? "|price = "       + game.data.price.initial         + "\n" : "");
			message.text +=  (this._getExists(game.data.metacritic)            ? "|mc_score = "    + game.data.metacritic.score      + "\n" : "");
			message.text +=  (this._getExists(game.data.metacritic)            ? "|mc_url = "      + game.data.metacritic.url        + "\n" : "");
			message.text +=  (this._getExists(game.data.achievements)          ? "|chieves = "     + game.data.achievements.total    + "\n" : "");
			message.text +=  (this._getExists(game.data.release_date.date)     ? "|release = "     + game.data.release_date.date     + "\n" : "");
			message.text +=  (this._getExists(game.data.controller_support)    ? "|controller = "  + game.data.controller_support    + "\n" : "");
			message.text +=  (this._getExists(game.data.supported_languages)   ? "|languages = "   + game.data.supported_languages   + "\n" : "");
			message.text += "}}\n\n";
			message.text +=  (this._getExists(game.data.detailed_description)  ? "===Detailed Description===\n"    + game.data.detailed_description  + "\n\n" : "");
			message.appid = game.data.steam_appid;
			message.gamename = game.data.name;
			message.summary = who + "initiated bot import of info for "+game.data.name+this.options.byeline;
			
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
		if(this.chatBot.muted==false) this._sendMessageAfterDelay(roomId, message);
		else this._sendMessageAfterDelay(chatterId,message);
	} else if(!extra || extra.nolog!=true) {
		var loginfo = info;
		if(extra.data) loginfo += "\n" + extra.data;
		if(extra.err)  loginfo += "\n" + extra.err.message + "\n" + extra.err.stack;
		else if(extra.error)  loginfo += "\n" + extra.error.message + "\n" + extra.error.stack;
		
		if(extra.level=="warn") winston.warn(loginfo);
		else if (extra.level=="err" || extra.level=="error") winston.error(loginfo);
		else winston.log(loginfo);
	}
}
