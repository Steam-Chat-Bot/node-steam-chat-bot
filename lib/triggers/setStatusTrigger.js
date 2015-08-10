var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that changes the bot's status.
command = string - a message must start with this + a space before a response will be given. Defaults to !status.

statuses = json! yay!
	If the given state is not allowed to be set, set the value for it to false.
	If it is allowed, but you want to change the name, set it to your new name.
	E.g. to disable snooze and set "looking to play" suffix to "playwithme", use
		statuses={"snooze":"false","play":"playwithme"};
	offline status is disabled by default.
		Do not enable it unless you have some way to tell the bot to go back online afterward
*/

var SetStatusTrigger = function() {
		SetStatusTrigger.super_.apply(this, arguments);
};

util.inherits(SetStatusTrigger, BaseTrigger);



var type = "SetStatusTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new SetStatusTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!status";
		trigger.options.statuses = trigger.options.statuses || {};
		trigger.options.statuses.online = trigger.options.statuses.online || "online";
		trigger.options.statuses.busy = trigger.options.statuses.busy || "busy";
		trigger.options.statuses.away = trigger.options.statuses.away || "away";
		trigger.options.statuses.snooze = trigger.options.statuses.snooze || "snooze";
		trigger.options.statuses.trade = trigger.options.statuses.trade || "trademe";
		trigger.options.statuses.play = trigger.options.statuses.play ||  "playme";
		trigger.options.statuses.offline = trigger.options.statuses.offline ||  false;
		return trigger;
};

// Return true if a message was sent
SetStatusTrigger.prototype._respondToFriendMessage = function(userId, message) {
		return this._respond(userId, message);
}

// Return true if a message was sent
SetStatusTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		return this._respond(roomId, message);
}

SetStatusTrigger.prototype._respond = function(toId, message) {
	var oquery = this._stripCommand(message);
	if(oquery && oquery.params[1]) {
		var query = oquery.params[1].toLowerCase();
		var statuses = this.options.statuses;
		if     (statuses.offline!==false && query === statuses.offline.toLowerCase()){ this.chatBot.setPersonaState(0); return true; }
		else if(statuses.online !==false && query === statuses.online.toLowerCase()) { this.chatBot.setPersonaState(1); return true; }
		else if(statuses.busy   !==false && query === statuses.busy.toLowerCase())   { this.chatBot.setPersonaState(2); return true; }
		else if(statuses.away   !==false && query === statuses.away.toLowerCase())   { this.chatBot.setPersonaState(3); return true; }
		else if(statuses.snooze !==false && query === statuses.snooze.toLowerCase()) { this.chatBot.setPersonaState(4); return true; }
		else if(statuses.trade  !==false && query === statuses.trade.toLowerCase())  { this.chatBot.setPersonaState(5); return true; }
		else if(statuses.play   !==false && query === statuses.play.toLowerCase())   { this.chatBot.setPersonaState(6); return true; }
	}
	return false;
}

SetStatusTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
