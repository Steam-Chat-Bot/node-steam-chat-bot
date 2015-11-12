var util = require("util");
var request = require("request");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that looks people on on steamrep on command.
command = string - a message must start with this + a space before a response will be given
*/

var SteamrepTrigger = function() {
	SteamrepTrigger.super_.apply(this, arguments);
};

util.inherits(SteamrepTrigger, BaseTrigger);

var type = "SteamrepTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new SteamrepTrigger(type, name, chatBot, options);
	trigger.options.command = trigger.options.command || "!steamrep";
	return trigger;
};

// Return true if a message was sent
SteamrepTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
SteamrepTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}


SteamrepTrigger.prototype._respond = function(toId, message) {
	var steamid = this._stripCommand(message);
	if (steamid) {
		var that = this;
		var steamrep={};
		that.winston.info(that.chatBot.name+"/"+that.name+": Checking steamrep.com for " + steamid);
		request.get({method:"GET",encoding:"utf8",uri:"https://steamrep.com/api/beta/reputation/"+steamid+"?json=1&extended=1",json:true,followAllRedirects:true}, function(error, response, body) {
			if (error) {
				that._sendMessageAfterDelay(toId, "An error has been logged.");
				that.winston.warn(that.chatBot.name+"/"+that.name+": Code " + response.statusCode + " from steamrep for steamid " + steamid);
				return;
			}
			steamrep = body;
			var result = that._getParsedResult(steamrep);
			if (result) {
				that._sendMessageAfterDelay(toId, result);
			}
			else {
				that._sendMessageAfterDelay(toId, "An error occurred, or there is no such user");
			}
		});
			return true;
	}
	return false;
}

SteamrepTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}

SteamrepTrigger.prototype._getParsedResult = function(steamrep) {
	if (steamrep.steamrep) {
		var status = steamrep.steamrep.flags.status;
		var url64 = "https://steamrep.com/profiles/"+steamrep.steamrep.steamID64;
		if(status==="exists") {
			var name = steamrep.steamrep.displayname;
			var membersince = steamrep.steamrep.membersince;
			var joined = new Date(membersince*1000);
			var customurl = steamrep.steamrep.customurl;
			var joinDate = joined.getDate();
			var joinMonth = "January,February,March,April,May,June,July,August,September,October,November,December".split(",")[joined.getMonth()];
			var joinYear = joined.getFullYear();
			var joinString = joinMonth + " " + joinDate + ", " + joinYear;
			var reputation = steamrep.steamrep.reputation;
			return name + "'s account " + (membersince>0 ? "was created on " + joinString + ", ": " ")
				+ (customurl!=="" ? "has a custom url of https://steamcommunity.com/id/" + customurl +" ": "has no custom url set ")
				+ (reputation!=="" ? " and has a steamrep reputation of '" + reputation +".'": ", and has no particular reputation on steamrep.")
				+ " For more information, please visit " + url64;
		} else if(status==="notfound") {
			return "This user has not yet been added to steamrep's database. To add them, please visit "+url64;
		}
		return "I don't understand what steamrep is telling me. Please check "+url64+" manually.";
	}
	return null;
}
