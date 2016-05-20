var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var steamid = require('steamid');
/*
Trigger that tells the bot to ban someone from a groupchat. Send a steamid64.
command = string - a message must start with this + a space before a response will be given
timerMultiplier = int - what to multiply the given number by for the unban timer. Defaults to 1000 (seconds) instead of 1 (ms)
*/

var BanTrigger = function() {
	BanTrigger.super_.apply(this, arguments);
};

util.inherits(BanTrigger, BaseTrigger);

var type = "BanTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new BanTrigger(type, name, chatBot, options);
		trigger.options.unbanMultiplier = options.unbanMultiplier || 1000;
		trigger.options.command = options.command || "!ban";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
BanTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
BanTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

BanTrigger.prototype._respond = function(roomId, userId, message) {
	var query = this._stripCommand(message);
	if(query) {
		this.chatBot.ban(query.parsed.room || roomId, query.parsed.user);
		if(query.parsed.timer) {
			var that = this;
			setTimeout(function(){
				that.chatBot.unban(query.parsed.room||roomId,query.parsed.user);
			},query.parsed.timer*that.options.unbanMultiplier);
		}
		return true;
	}
	return false;
}

BanTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		var params = message.split(" ");
		var parsed = {};
		for (var i = 0; i<params.length; i++) {
			if(parseInt(params[i]) < 1e7) {
				parsed.timer = parseInt(params[i]);
			} else {
				var sid = steamid(params[i]);
				if (sid.type===steamid.Type.CLAN) {
					parsed.room = params[i];
				} else if(sid.type===steamid.Type.INDIVIDUAL) {
					parsed.user = params[i];
				}
			}
		}
		return {message: message, params: message.split(" "),parsed:parsed};
	}
	return null;
}
