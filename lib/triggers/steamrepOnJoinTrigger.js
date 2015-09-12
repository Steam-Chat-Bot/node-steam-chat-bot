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
		var params = {
			method:"GET",    encoding:"utf8",    json:true,    followAllRedirects:true,
			uri:"http://steamrep.com/api/beta/reputation/"+steamid+"?json=1&extended=1"
		}
		request.get(params, function(error, response, body) {
			if (error) {
				var err = response && "Code "+response.statusCode || error;
				that.winston.warn(that.chatBot.name+"/"+that.name+": " + err + " from steamrep for " + steamid);
				return;
			}
			var result = body && body.steamrep && that._getParsedResult(body.steamrep) || null;
			if (result) {
				that._sendMessageAfterDelay((that.options.whoToTell ? that.options.whoToTell : roomId), result);
			}
		});
		return true;
	}
	return false;
}

SteamrepOnJoinTrigger.prototype._getParsedResult = function(data) {
	if(data.flags.status==="exists" && (data.reputation.toLowerCase().indexOf("scammer") >= 0)) {
		return data.displayname + " is listed as a SCAMMER on steamrep!"
			+" For more information, please visit http://steamrep.com/profiles/"+data.steamID64;
	}
	return null;
}
