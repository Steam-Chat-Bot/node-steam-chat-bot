var util = require("util");
var request = require("request");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var TinyCache = require( "tinycache" );
var cache = new TinyCache();
/*
Trigger that automatically looks up users on reddit when they join.
option cacheTime: Data will be cached to reduce server request wait time. Defaults to 1 hour.
*/

var RedditTrigger = function() {
	RedditTrigger.super_.apply(this, arguments);
};

util.inherits(RedditTrigger, BaseTrigger);

var type = "RedditTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new RedditTrigger(type, name, chatBot, options);
	trigger.respectsMute = false;
	trigger.options.command = trigger.options.command || "!redditrep";
	trigger.options.cacheTime = trigger.options.cacheTime || 1 * 60 * 60 * 1000;
	return trigger;
};

// Return true if a message was sent
RedditTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
RedditTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

RedditTrigger.prototype._respond = function(toId, message) {
	if(!this.options.redditapiurl) {
		that.winston.error("Reddit API Url not defined! Cannot look up user!");
		return false;
	}
	var steamid = this._stripCommand(message);
	if (steamid==="") steamid=toId;
	if (steamid) {
		var that = this;
		var steamrep={};
		var steamid = (steamid.substr(-1)=="/" ? steamid.substr(0,steamid.length-1) : steamid); //strip trailing slash
		var steamid = steamid.replace("http://","").replace("https://","").replace("reddit.com/","").replace("www.","").replace("steamcommunity.com/profiles/","");
		var fullurl = that.options.redditapiurl + (!isNaN(steamid) ? "steamid/" + steamid : "reddit/" + steamid.replace("/u/","").replace("/user/","").replace("u/","").replace("user/",""));
		var cachedResult=cache.get(steamid);
		if(cachedResult==null) {
			that.winston.info("Checking reddit for " + steamid);
			request.get({method:"GET",encoding:"utf8",uri:fullurl,json:true,followAllRedirects:true}, function(error, response, body) {
				if (error) {
					that._sendMessageAfterDelay(toId, "Error obtaining data from Reddit.");
					that.winston.warn("Code " + response.statusCode + " from REDDIT for steamid " + steamid);
					return;
				}
				var redditinfo = body;
				if (redditinfo && redditinfo.success==true) redditinfo.steamid = redditinfo.steamid.replace("http://steamcommunity.com/profiles/","");
				var result = that._getParsedResultForRequest(redditinfo, redditinfo.steamid);
				if (result) {
					that._sendMessageAfterDelay(toId, result);
					cache.put(steamid,result,that.options.cacheTime);
				}
				else {
					that._sendMessageAfterDelay(toId, ("User " + ((that.chatBot.steamClient.users && steamid in that.chatBot.steamClient.users) ? (that.chatBot.steamClient.users[steamid].playerName + "/"+steamid) : steamid) + " is not in my system."));
				}
			});
		} else {
			that.winston.debug("Using cached Reddit data for " + steamid);
			that._sendMessageAfterDelay(toId, cachedResult);
		}
		return true;
	}
	return false;
}

RedditTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}

RedditTrigger.prototype._getParsedResultForRequest = function(redditinput, steamid) {
	if (redditinput && redditinput.success) {
		var message="";
		if(redditinput.success && redditinput.banstatus) {
			message += ((this.chatBot.steamClient.users && steamid in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[steamid].playerName + "/"+steamid) : steamid) + " has been BANNED from /r/SGS.";
			message += (redditinput.reddit ? ("\nReddit profile: http://www.reddit.com/user/"+redditinput.reddit) : "");
			message += "\nSteam Profile: http://steamcommunity.com/profiles/"+steamid;
			message += "\nSteamrep: http://steamrep.com/profiles/" + steamid;
			message += (redditinput.banreason ? ("\nReddit Ban Reason: " + redditinput.banreason) : "");
		} else if(redditinput.success && redditinput.flair && redditinput.flair.substr(0,3) == "mod") {
			message = ((this.chatBot.steamClient.users && steamid in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[steamid].playerName + "/"+steamid) : steamid);
			message += " AKA /u/" + redditinput.reddit + ", moderator(?) of /r/SGS!" + redditinput.flair;
		} else if(redditinput.success) {
			var flair = ". Current flair level: ";
			if(redditinput.flair=="tier0")       flair+= "White, with no recorded trades in /r/SGS.";
			else if(redditinput.flair=="tier1")  flair+= "Gray, with 1+ SGS trades.";
			else if(redditinput.flair=="tier2")  flair+= "Blue, with 5+ SGS trades.";
			else if(redditinput.flair=="tier3")  flair+= "Red, with 10+ SGS trades.";
			else if(redditinput.flair=="tier4")  flair+= "Green, with 20+ SGS trades.";
			else if(redditinput.flair=="tier5")  flair+= "Purple, with 50+ SGS trades.";
			else if(redditinput.flair=="white")  flair+= "White, with no recorded trades in /r/SGS.";
			else if(redditinput.flair=="gray")   flair+= "Gray, with 1+ SGS trades.";
			else if(redditinput.flair=="blue")   flair+= "Blue, with 5+ SGS trades.";
			else if(redditinput.flair=="red")    flair+= "Red, with 10+ SGS trades.";
			else if(redditinput.flair=="green")  flair+= "Green, with 20+ SGS trades.";
			else if(redditinput.flair=="purple") flair+= "Purple, with 50+ SGS trades.";
			else flair += "not a level I understand. The raw data I got was '"+redditinput.flair+"'.";
			message = "That is "+((this.chatBot.steamClient.users && steamid in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[steamid].playerName + "/"+steamid) : steamid);
			message += " AKA /u/" + redditinput.reddit + flair;
		}
		return message;
	}
	return false;
}
