var util = require("util");
var request = require("request");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that automatically looks up users on steamrep when they join.
whoToTell = If defined, tell this person when a scammer joins. Otherwise report to the channel.
*/

var SteamrepOnJoinTrigger = function() {
	SteamrepOnJoinTrigger.super_.apply(this, arguments);
};

util.inherits(SteamrepOnJoinTrigger, BaseTrigger);

var type = "SteamrepOnJoinTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new SteamrepOnJoinTrigger(type, name, chatBot, options);
	trigger.respectsMute = false;
	trigger.allowMessageTriggerAfterResponse = true;
	return trigger;
};

SteamrepOnJoinTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	return this._respond(roomId,userId);
}

SteamrepOnJoinTrigger.prototype._respond = function(roomId,userToCheck) {
	var steamid = ""+userToCheck+"";
	if (steamid) {
		var that = this;
		var steamrep={};
		that.winston.info(that.chatBot.name+"/"+that.name+": Checking steamrep.com for " + steamid);
		request.get({method:"GET",encoding:"utf8",uri:"http://steamrep.com/api/beta/reputation/"+steamid+"?json=1&extended=1",json:true,followAllRedirects:true}, function(error, response, body) {
			if (error) {
				try { that.winston.warn(that.chatBot.name+"/"+that.name+": Code " + response.statusCode + " from steamrep for steamid " + steamid); } catch (err) { that.winston.warn(that.chatBot.name+"/"+that.name,err) }
				return;
			}
			steamrep = body;
			var result = that._getParsedResult(steamrep);
			if (result) {
				that._sendMessageAfterDelay((that.options.whoToTell ? that.options.whoToTell : roomId), result);
			}
		});
			return true;
	}
	return false;
}

SteamrepOnJoinTrigger.prototype._getParsedResult = function(steamrep) {
	if (steamrep && steamrep.steamrep) {
		if(steamrep.steamrep.flags.status==="exists" && (steamrep.steamrep.reputation.toLowerCase().indexOf("scammer") >= 0)) {
			return (steamrep.steamrep.displayname + " is listed as a SCAMMER on steamrep! For more information, please visit http://steamrep.com/profiles/"+steamrep.steamrep.steamID64);
		} else {
			return null;
		}
	}
	return null;
}
