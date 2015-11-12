var util = require("util");
var request = require("request");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var TinyCache = require( "tinycache" );
var cache1 = new TinyCache();
var cache2 = new TinyCache();
/*
Trigger that automatically looks up users on reddit when they join.
options:
cacheJoinedTime - If the user joined the chat previously within this many ms, trigger will not fire. Defaults to 1 hour.
cacheDataTime - data will be cached for this long to reduce wait for obtaining data. Defaults to 1 hour.
*/

var RedditOnJoinTrigger = function() {
	RedditOnJoinTrigger.super_.apply(this, arguments);
};

util.inherits(RedditOnJoinTrigger, BaseTrigger);

var type = "RedditOnJoinTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new RedditOnJoinTrigger(type, name, chatBot, options);
	trigger.respectsMute = false;
	trigger.options.cacheJoinedTime = trigger.options.cacheTime || 1 * 60 * 60 * 1000;
	trigger.options.cacheDataTime = trigger.options.cacheTime || 1 * 60 * 60 * 1000;
	trigger.allowMessageTriggerAfterResponse = true;
	return trigger;
};

RedditOnJoinTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	if(cache1.get(userId)===null) {
		cache1.put(userId,"sent",this.options.cacheJoinedTime);
		return this._respond(roomId,userId);
	} else {
		return false;
	}
}

RedditOnJoinTrigger.prototype._respond = function(roomId,userToCheck) {
	if(!this.options.redditapiurl) {
		this.winston.error(this.chatBot.name+"/"+this.name+": Reddit API Url not defined! Cannot look up user!");
		return false;
	}
	var steamid = ""+userToCheck+"";
	if (steamid) {
		var that = this;
		var cachedResult=cache2.get(steamid);
		if(cachedResult===null) {
			that.winston.info(that.chatBot.name+"/"+that.name+": Checking reddit for " + steamid);
			request.get({method:"GET",encoding:"utf8",uri:that.options.redditapiurl+"steamid/"+steamid,json:true,followAllRedirects:true}, function(error, response, body) {
				if (error) {
					try { that.winston.warn(that.chatBot.name+"/"+that.name+": Code " + response.statusCode + " from redditapi for steamid " + steamid); } catch (err) { that.winston.error(that.chatBot.name+"/"+that.name,err.stack) }
					return;
				}
				var redditinfo = body;
				redditinfo.steamid = redditinfo.steamid.replace("https://steamcommunity.com/profiles/","");
				var result = that._getParsedResultForJoin(redditinfo, steamid);
				if (result) {
					that._sendMessageAfterDelay(roomId, result);
					cache2.put(steamid,result,that.options.cacheDataTime);
				}
			});
		} else {
			that._sendMessageAfterDelay(toId, cachedResult);
		}
		return true;
	}
	return false;
}

RedditOnJoinTrigger.prototype._displayName = function(steamid) {
	if(this.chatBot.steamFriends.personaStates && steamid in this.chatBot.steamFriends.personaStates) {
		return this.chatBot.steamFriends.personaStates[steamid].player_name + "/"+steamid;
	} else {
		return steamid;
	}
}

RedditOnJoinTrigger.prototype._getParsedResultForJoin = function(redditinput, steamid) {
	if (redditinput && redditinput.success) {
		var message="";
		if(redditinput.success && redditinput.banstatus) {
			message = this._displayName(steamid)
				+ " has been BANNED from /r/SGS."
				+ (redditinput.reddit ? ("\nReddit profile: https://www.reddit.com/user/"+redditinput.reddit) : "")
				+ "\nSteam Profile: https://steamcommunity.com/profiles/"+steamid
				+ "\nSteamrep: https://steamrep.com/profiles/" + steamid
				+ (redditinput.banreason ? ("\nReddit Ban Reason: " + redditinput.banreason) : "");
		} else if(redditinput.success && redditinput.flair && redditinput.flair.substr(0,3) === "mod") {
			message = "Welcome, " + this._displayName(steamid)
				+ " AKA /u/" + redditinput.reddit
				+ ", moderator(?) of /r/SGS! Your (raw) flair is " + redditinput.flair;
		} else if(redditinput.success) {
			var flair = ". Your current flair level is ";
			if(redditinput.flair==="tier0")         { flair+= "White, with no recorded trades in /r/SGS.";
			} else if(redditinput.flair==="tier1")  { flair+= "Gray, with 1+ SGS trades.";
			} else if(redditinput.flair==="tier2")  { flair+= "Blue, with 5+ SGS trades.";
			} else if(redditinput.flair==="tier3")  { flair+= "Red, with 10+ SGS trades.";
			} else if(redditinput.flair==="tier4")  { flair+= "Green, with 20+ SGS trades.";
			} else if(redditinput.flair==="tier5")  { flair+= "Purple, with 50+ SGS trades.";
			} else if(redditinput.flair==="white")  { flair+= "White, with no recorded trades in /r/SGS.";
			} else if(redditinput.flair==="gray")   { flair+= "Gray, with 1+ SGS trades.";
			} else if(redditinput.flair==="blue")   { flair+= "Blue, with 5+ SGS trades.";
			} else if(redditinput.flair==="red")    { flair+= "Red, with 10+ SGS trades.";
			} else if(redditinput.flair==="green")  { flair+= "Green, with 20+ SGS trades.";
			} else if(redditinput.flair==="purple") { flair+= "Purple, with 50+ SGS trades.";
			} else { flair += "not a level I understand. The raw data I got was '"+redditinput.flair+"'."; }
			message = "Welcome, " + this._displayName(steamid)
				+ " AKA /u/" + redditinput.reddit + flair;
		}
		return message;
	}
	return null;
}
