var util = require('util');
var winston = require('winston');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that changes the bot's status.
command = string - a message must start with this + a space before a response will be given. Defaults to !status.
allowpublic = bool - allow the command to be used in a groupchat.
allowprivate = bool - allow the command to be used in a private message.

statuses = json! yay! If the given state is not allowed to be set, set the value for it to false. If it is allowed, but you want to change the name, set it to your new name. E.g. to disable snooze and set 'looking to play' suffix to 'playwithme', use statuses={'snooze':'false','play':'playwithme'};
offline status is disabled by default. Do not enable it unless you have some way to tell the bot to go back online afterward (This is not currently possible).
*/

var SetStatusTrigger = function() {
		SetStatusTrigger.super_.apply(this, arguments);
};

util.inherits(SetStatusTrigger, BaseTrigger);



var type = "SetStatusTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
		var trigger = new SetStatusTrigger(type, name, chatBot, options);
		trigger.options.commands = trigger.options.commands || "!status";
		trigger.options.statuses = trigger.options.statuses || {};
		trigger.options.statuses.online = trigger.options.statuses.online || "online";
		trigger.options.statuses.busy = trigger.options.statuses.busy || "busy";
		trigger.options.statuses.away = trigger.options.statuses.away || "away";
		trigger.options.statuses.snooze = trigger.options.statuses.snooze || "snooze";
		trigger.options.statuses.trade = trigger.options.statuses.trade || "trademe";
		trigger.options.statuses.play = trigger.options.statuses.play ||  "playme";
		trigger.options.statuses.offline = trigger.options.statuses.offline ||  false;
		trigger.options.allowpublic = trigger.options.allowpublic || true;
		trigger.options.allowprivate = trigger.options.allowprivate || true;
		return trigger;
};

// Return true if a message was sent
SetStatusTrigger.prototype._respondToFriendMessage = function(userId, message) {
		if(this.options.allowprivate) return this._respond(userId, message); else return false;
}

// Return true if a message was sent
SetStatusTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
		if(this.options.allowpublic) return this._respond(roomId, message); else return false;
}

SetStatusTrigger.prototype._respond = function(toId, message) {
		var query = this._stripCommand(message).toLowerCase();
		if(trigger.options.statuses.offline!=false && query == trigger.options.statuses.offline){ this.chatBot.setPersonaState(0); return true; }
		if(trigger.options.statuses.online !=false && query == trigger.options.statuses.online) { this.chatBot.setPersonaState(1); return true; }
		if(trigger.options.statuses.busy   !=false && query == trigger.options.statuses.busy)   { this.chatBot.setPersonaState(2); return true; }
		if(trigger.options.statuses.away   !=false && query == trigger.options.statuses.away)   { this.chatBot.setPersonaState(3); return true; }
		if(trigger.options.statuses.snooze !=false && query == trigger.options.statuses.snooze) { this.chatBot.setPersonaState(4); return true; }
		if(trigger.options.statuses.trade  !=false && query == trigger.options.statuses.trade)  { this.chatBot.setPersonaState(5); return true; }
		if(trigger.options.statuses.play   !=false && query == trigger.options.statuses.play)   { this.chatBot.setPersonaState(6); return true; }
		return false;
}

SetStatusTrigger.prototype._stripCommand = function(message) {
		if (this.options.commands && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
				return message.substring(this.options.command.length + 1);
		}
		return null;
}