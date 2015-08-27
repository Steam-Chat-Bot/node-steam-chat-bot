var util = require("util");
var request = require("request");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var MediaWiki = require("mediawiki");
/*
Trigger that adds entries to igbWiki on command.
endpoint = string - what is the api endpoint? defaults to IGBWiki
cmdImport = string - Command to import a page with info from steam api. Input a single appid or comma-separated list. Default !import
cmdEdit = string - Command to edit a page. Defaults to !edit
cmdMove = string - Command to move a page. Defaults to !move
cmdRedir = string - Command to redirect a page. Defaults to !redirect
wikiUsername = string - the username for the bot on the wikiUsername.
wikiPassword = string - the password for the bot on the wiki.
userAgent = string - the bot's useragent on the wiki. Defaults to "freakbot <https://igbwiki.com/wiki/User:freakbot>",
byeline = string - the bot's signature on pages it edits. Defaults to " - freakbot"
categories = string, array[string,string] - category name (or array of categories) to add to imported articles.
	Defaults to Incomplete; articles created by the bot will only have information on the game itself, not what bundles it was in, etc.
redirAppId = bool - when importing, should we set up automatic redirects from appid to game article?
redirCase = bool - when importing, should we set up a redirect from all-lowercase game name to correct page?
*/

var WikiBotTrigger = function() {
	WikiBotTrigger.super_.apply(this, arguments);
};

util.inherits(WikiBotTrigger, BaseTrigger);

var type = "WikiBotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new WikiBotTrigger(type, name, chatBot, options);
		trigger.options.endpoint    = trigger.options.server      || "https://igbwiki.com/w/api.php"; //server
		trigger.options.cmdImport   = trigger.options.cmdImport   || "!import";
		trigger.options.cmdEdit     = trigger.options.cmdEdit     || "!edit";
		trigger.options.cmdMove     = trigger.options.cmdMove     || "!move";
		trigger.options.cmdDel      = trigger.options.cmdDel      || "!del";
		trigger.options.cmdLogin    = trigger.options.cmdLogin    || "!login";
		trigger.options.cmdRedir    = trigger.options.cmdRedir    || "!redirect";
		trigger.options.redirAppId  = trigger.options.redirAppId  || false;
		trigger.options.redirCase   = trigger.options.redirCase   || false;
		trigger.options.userAgent   = trigger.options.userAgent   || "freakbot <https://igbwiki.com/wiki/User:freakbot>";
		trigger.options.byeline     = trigger.options.byeline     || " - freakbot";
		trigger.options.categories  = trigger.options.categories  || "Incomplete";
		trigger.wikiBot = trigger.wikiBot || new MediaWiki.Bot({
			endpoint: trigger.options.endpoint,
			rate: trigger.options.rate,
			userAgent: trigger.options.userAgent,
			byeline: trigger.options.byeline
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
	query = this._stripCommand(message, this.options.cmdLogin);
	if(query) {
		this._logIn(toId);
		return true;
	}
	query = this._stripCommand(message, this.options.cmdRedir);
	if(query) {
		this._redirectPage(toId,steamId,query);
		return true;
	}
	return false;
}

WikiBotTrigger.prototype._logIn = function(toId, callback) {
	var that = this;
	var afterwhoami = function(username){
		if(that.options.wikiUsername===username){
			that.winston.info(that.chatBot.name+"/"+that.name+": Already logged in.");
			if(callback && typeof callback==="function") {
				callback(true);
			} else {
				that._sendMessageAfterDelay(toId,"Already logged in.");
			}
		} else {
			var afterlogin = function(username){
				that.winston.info(that.chatBot.name+"/"+that.name+": Logged in as "+username);
				if(callback && typeof callback==="function") {
					callback(username);
				} else {
					that._sendMessageAfterDelay(toId,"Logged in as "+username);
				}
			}
			var loginerr = function(err){
				that.winston.err(that.chatBot.name+"/"+that.name+": "+err)
				if(err.message==="NotExists") {
					that._sendMessageAfterDelay(toId,"Error logging in: Wrong username. Aborting.");
				} else if(err.message==="WrongPass") {
					that._sendMessageAfterDelay(toId,"Error logging in: Wrong password. Aborting.");
				} else {
					that._sendMessageAfterDelay(toId,"Unknown error logging in. See log for details. Aborting.");
				}
			}
			that.wikiBot.login(that.options.wikiUsername, that.options.wikiPassword).complete(afterlogin).error(loginerr);
		}
	}
	this.wikiBot.whoami().complete(afterwhoami);
}

WikiBotTrigger.prototype._redirectPage = function(toId,steamId,message) {
	var whoCalled = ((this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates)
	? (this.chatBot.steamFriends.personaStates[steamId].player_name + "/"+steamId)
	: steamId);
	var params = message.split("||");
	if(params.length < 2) {
		this._sendMessageAfterDelay(toId,"You need to specify the following: \"" +this.options.commandMove+" OldName||NewName[||Summary]\"");
		return;
	}
	var from = params[0];
	var to = params[1];
	var that = this;
	if(from.substring(1).toLowerCase()===to.substring(1).toLowerCase()) {
		this._sendMessageAfterDelay(toId,"This would create a self-referential redirect. Try again.");
		return;
	}
	var summary = whoCalled+" is redirecting this page "+(params[2] ? " because: "+params[2]: "") + ".";
	var afterlogin = function(username){
		if(username===true) {
			that._sendMessageAfterDelay(toId,"Already logged in");
		} else if(username) {
			that._sendMessageAfterDelay(toId,"Logged in as "+username);
		}
		var afteredit = function (title, revision, date) {
			if(revision && date && title) {
				that._sendMessageAfterDelay(toId,"Revision #" + revision + " completed at " + date.toString() +". "+from+" redirected to "+to+".");
				that.winston.info(that.chatBot.name+"/"+that.name+": Revision #" + revision + " completed at " + date.toString() +". "+from+" redirected to "+to+".");
			} else {
				that._sendMessageAfterDelay(toId,"Page for "+result.appid+"/"+result.gamename+" not edited. Current page is the same.");
				that.winston.debug(that.chatBot.name+"/"+that.name+": Page for "+result.appid+"/"+result.gamename+" not edited. Current page is the same.");
			}
		}
		var editerr = function(error){
			that._sendMessageAfterDelay(toId,"Failed to redirect "+from+" to "+to+". More info in log.");
			that.winston.error(that.chatBot.name+"/"+that.name+": "+error);
		}
		that.wikiBot.edit(from, "#Redirect [["+to+"]]", summary).complete(afteredit).error(editerr);
	}
	that._logIn(toId,afterlogin);
}

WikiBotTrigger.prototype._editPage = function(toId,steamId,query) {
	var whoCalled = ((this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates)
	? (this.chatBot.steamFriends.personaStates[steamId].player_name + "/"+steamId)
	: steamId);
	var lines = query.split("\n");
	var summary = (lines[lines.length-1].toLowerCase().indexOf("summary: ") === 0 ? true : false);
	summary = whoCalled+" is editing this page " + (summary ? "because "+lines.pop().substring(9): "");
	var articlename = lines.shift();
	if(lines.length < 2) {
		this._sendMessageAfterDelay(toId,"You need to include an article title on the first line, content, and optionally a summary in the last line, prefixed with \"summary: \"");
		return;
	}
	var that = this;
	var afterlogin = function(username){
		if(username===true) {
			that._sendMessageAfterDelay(toId,"Already logged in");
		} else if(username) {
			that._sendMessageAfterDelay(toId,"Logged in as "+username);
		}
		var afteredit = function (title, revision, date) {
			that._sendMessageAfterDelay(toId,"Revision #" + revision + " completed at " + date.toString() + ". "+title+" edited.");
			that.winston.info(that.chatBot.name+"/"+that.name+": Revision #" + revision + " completed at " + date.toString()+". "+title+" edited.");
		}
		var editerr = function(error){
			that._sendMessageAfterDelay(toId,"Failed to edit "+articlename+". More info in log.");
			that.winston.error(that.chatBot.name+"/"+that.name+": "+error.stack);
		}
		that.wikiBot.edit(articlename, lines.join("\n"), summary).complete(afteredit).error(editerr);
	}
	this._logIn(toId,afterlogin);
}

WikiBotTrigger.prototype._importGames = function(toId,steamId,query) {
	var that = this;
	var afterSteamFetch = function(error, response, body) {
		if (error) {
			try {
				that.winston.warn(that.chatBot.name+"/"+that.name+": Code " + response.statusCode + " from steam");
				that._sendMessageAfterDelay(toId, "Code " + response.statusCode + " from steam");
			} catch (err) {
				that.winston.warn(that.chatBot.name+"/"+that.name,err.stack)
			}
			return;
		}
		var info = body;
		var afterlogin = function(username){
			if(username===true) {
				that._sendMessageAfterDelay(toId,"Already logged in");
			} else if(username) {
				that._sendMessageAfterDelay(toId,"Logged in as "+username);
			}
			try {
				var whoCalled = ((that.chatBot.steamFriends.personaStates && steamId in that.chatBot.steamFriends.personaStates)
				? (that.chatBot.steamFriends.personaStates[steamId].player_name + "/"+steamId)
				: steamId);
				for (var key in info) {
					var result = that._getParsedResult(body[key], whoCalled);
					if(result.success) {
						var afterimport = function (title, revision, date) {
							if(revision && date && title) {
								that._sendMessageAfterDelay(toId,"Revision #" + revision + " completed at " + date.toString() + ". Data imported for "+result.appid+"/"+result.gamename);
								that.winston.info(that.chatBot.name+"/"+that.name+": Revision #" + revision + " completed at " + date.toString() + ". Data imported for "+result.appid+"/"+result.gamename);
							} else {
								that._sendMessageAfterDelay(toId,"Page for "+result.appid+"/"+result.gamename+" not edited. Current page is the same.");
								that.winston.debug(that.chatBot.name+"/"+that.name+": Page for "+result.appid+"/"+result.gamename+" not edited. Current page is the same.");
							}
							if(result.gamename.substring(1).toLowerCase()!==result.gamename.substring(1)) {
								var afterEdit = function(redtitle, redrevision, reddate){
									if(redrevision) {
										that._sendMessageAfterDelay(toId,"Revision #" + redrevision + " completed at " + reddate.toString()+". "+result.gamename.toLowerCase()+" redirected to "+result.gamename+".");
										that.winston.info(that.chatBot.name+"/"+that.name+": Revision #" + redrevision + " completed at " + reddate.toString()+". "+result.gamename.toLowerCase()+" redirected to "+result.gamename+".");
									} else {
										that._sendMessageAfterDelay(toId,"Lowercase redirect for "+result.appid+"/"+result.gamename+" not created. Already exists.");
										that.winston.debug(that.chatBot.name+"/"+that.name+": Lowercase redirect for "+result.appid+"/"+result.gamename+" not created. Already exists.");
									}
								}
								var editErr = function(rederr){
									that._sendMessageAfterDelay(toId,"Failed to redirect "+result.gamename.toLowerCase()+" to "+result.gamename+". More info in log.");
									that.winston.error(that.chatBot.name+"/"+that.name+": "+rederr.stack);
								}
								that.wikiBot.edit(result.gamename.toLowerCase(), "#Redirect [["+result.gamename+"]]", "redirecting lowercase of last import").complete(afterEdit).error(editErr);
							} else {
								that._sendMessageAfterDelay(toId,"Redirecting game title "+result.gamename.toLowerCase()+" to "+result.gamename+"; would overwrite main game page.");
								that.winston.info(that.chatBot.name+"/"+that.name+": Redirecting game title "+result.gamename.toLowerCase()+" to "+result.gamename+"; would overwrite main game page.");
							}
							var afteredit = function(redtitle,redrevision,reddate){
								if(redrevision) {
									that._sendMessageAfterDelay(toId,"Revision #" + redrevision + " completed at " + reddate.toString()+". "+result.appid+" redirected to "+result.gamename+".");
									that.winston.info(that.chatBot.name+"/"+that.name+": Revision #" + redrevision + " completed at " + reddate.toString()+". "+result.appid+" redirected to "+result.gamename+".");
								} else {
									that._sendMessageAfterDelay(toId,"Appid Redirect for "+result.appid+"/"+result.gamename+" not created. Already exists.");
									that.winston.debug(that.chatBot.name+"/"+that.name+": Appid Redirect for "+result.appid+"/"+result.gamename+" not created. Already exists.");
								}
							}
							var editerr = function(rederr){
								that._sendMessageAfterDelay(toId,"Failed to redirect "+result.appid+" to "+result.gamename+". More info in log.");
								that.winston.error(that.chatBot.name+"/"+that.name+": "+rederr.stack);
							}
							that.wikiBot.edit(result.appid, "#Redirect [["+result.gamename+"]]", "Redirecting appid of last import").complete(afteredit).error(editerr);
						}
						var importerr = function(err){
							that._sendMessageAfterDelay(toId,"Edit fail for "+result.gamename+". More info in log");
							that.winston.error(that.chatBot.name+"/"+that.name+": "+err.stack);
						}
						that.wikiBot.edit(result.gamename, result.text, result.summary).complete(afterimport).error(importerr);
					} else {
						that._sendMessageAfterDelay(toId,"Edit fail for "+key+". "+key+" is not a valid appId.");
					}
				}
			} catch (err) {
				that._sendMessageAfterDelay(toId,"Failure. More info in log");
				that.winston.error(err.stack);
			}
		}
		that._logIn(toId,afterlogin);
	}
	request.get({method:"GET",encoding:"utf8",uri:"http://store.steampowered.com/api/appdetails/?appids="+query,json:true,followAllRedirects:true}, afterSteamFetch);
}
WikiBotTrigger.prototype._stripCommand = function(msg, cmd) {
	var command = (cmd ? cmd.toLowerCase() : this.options.command.toLowerCase());
	if(typeof command==="string" && msg) {
		if(msg.toLowerCase().indexOf(command+" ")===0||msg.toLowerCase().indexOf(command+"\n")===0) {
			return msg.substring(command.length + 1);
		} else if (msg.toLowerCase()===command) {
			return true;
		}
	}
	return null;
}
WikiBotTrigger.prototype._getParsedResult = function(game, who) {
	if (game.success===true && game.data) {
		var message = { success:true };
			message.text = "{{Game\n";
			message.text +=  (this._getExists(game.data.name)                  ? "|name = "        + game.data.name                  + "\n" : "");
			message.text +=  (this._getExists(game.data.developers)            ? "|dev = "         + game.data.developers.join(", ") + "\n" : "");
			message.text +=  (this._getExists(game.data.publishers)            ? "|pub = "         + game.data.publishers.join(", ") + "\n" : "");
			message.text +=  (this._getExists(game.data.website)               ? "|site = "        + game.data.website               + "\n" : "");
			message.text +=  (this._getExists(game.data.website)               ? "|sitename = Automatic Import - Unknown."      + "\n" : "");
			message.text +=  (this._getExists(game.data.steam_appid)           ? "|steam = "       + game.data.steam_appid           + "\n" : "");
			message.text +=  (this._getExists(game.data.price)                 ? "|price = "       + game.data.price.initial         + "\n" : "");
			message.text +=  (this._getExists(game.data.metacritic)            ? "|mc_score = "    + game.data.metacritic.score      + "\n" : "");
			message.text +=  (this._getExists(game.data.metacritic)            ? "|mc_url = "      + game.data.metacritic.url        + "\n" : "");
			message.text +=  (this._getExists(game.data.achievements)          ? "|chieves = "     + game.data.achievements.total    + "\n" : "");
			message.text +=  (this._getExists(game.data.release_date.date)     ? "|release = "     + game.data.release_date.date     + "\n" : "");
			message.text +=  (this._getExists(game.data.controller_support)    ? "|controller = "  + game.data.controller_support    + "\n" : "");
			message.text +=  (this._getExists(game.data.supported_languages)   ? "|languages = "   + game.data.supported_languages   + "\n" : "");
			message.text += "}}\n\n";
			message.text +=  (this._getExists(game.data.detailed_description)  ? "=Detailed Description=\n"    + game.data.detailed_description  + "\n\n" : "");
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
		return message;
	}
	return game;
}

WikiBotTrigger.prototype._getExists = function(input) {
	if(input===false) { return false;
	} else if(input===undefined) { return false;
	} else if(input===0) { return false;
	} else if(input==="") { return false;
	} else { return true;
	}
}
