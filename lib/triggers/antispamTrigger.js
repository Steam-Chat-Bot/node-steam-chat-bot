var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Punishes spammers. Assigns a penalty to every message in a groupchat, and when a certain score is reached, it penalizes the user.
Options:
ignores - array of strings([]) = users that won't be penalized (this trigger will effectively not see them). You probably want to put yourself here. (this is a built-in)
logLevel - string(info) = what level should we log at? Choose a level from the top of chatBot.js
admins - array of strings([]) = admins that the bot tattles to. You probably want to put yourself here. This function doesn't differentiate between users and groupchats, so you can have it report to a groupchat as well.
score - object = at what score should a certain action be taken?
score.warn - int(3) = when should we warn the user?
score.kick - int(6) = when should we kick the user?
score.ban - int(8) = when should we ban the user?
score.ignore - int(10) = when should we add the user to the global ignore list
score.tattle - int(4) = when should we tell the admins?
msgPenalty - int(1) = how much should we add to a user's score on each message?
timers - object = timer setup. Mostly how many timer cycles should we perform certain actions after (ie how long punishments last)
timers.unban - int(5*60*1000=5min) = when should we unban a user?
timers.unignore - int(5*60*1000) = when should we unignore?
ptimer - object = use this to control how fast the score decreases, ie if you want to reset the score entirely or just decrease it.
ptimer.resolution - int(1000=1s) = How many milliseconds between decreasing the score?
ptimer.amount - int(1) = how much to decrease the score each time?
badwords - object = assign custom score to bad words. Set a penalty to null to use the default penalty. Per-message penalty will also apply. You'll probably want to adjust the warnMessage if you set this. example below:
			badwords: { fudge:10, sucks:5, "eat me":null }
TODO: Use cache to save punishments and revert them during onload; don't keep punishments if the bot crashes
*/

var AntispamTrigger = function() {
	AntispamTrigger.super_.apply(this, arguments);
};

util.inherits(AntispamTrigger, BaseTrigger);

var type = "AntispamTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new AntispamTrigger(type, name, chatBot, options);
	trigger.allowMessageTriggerAfterResponse = true;
	trigger.options.logLevel          = options.logLevel          || "info";
	trigger.options.admins            = options.admins            || [];
	trigger.options.score             = options.score             || {};
	trigger.options.score.warn        = options.score.warn        || 3;
	trigger.options.score.kick        = options.score.kick        || 6;
	trigger.options.score.ban         = options.score.ban         || 8;
	trigger.options.score.ignore      = options.score.ignore      || 10;
	trigger.options.score.tattle      = options.score.tattle      || 4;
	trigger.options.timers            = options.timers            || {};
	trigger.options.timers.unban      = options.timers.unban      || 5*60*1000;
	trigger.options.timers.unignore   = options.timers.unignore   || 5*60*1000;
	trigger.options.warnMessage       = options.warnMessage       || "Spamming is against the rules!";
	trigger.options.ptimer            = options.pTimer            || {};
	trigger.options.ptimer.resolution = options.ptimer.resolution || 1000;
	trigger.options.ptimer.amount     = options.ptimer.amount      || 1;
	trigger.options.msgPenalty        = options.msgPenalty        || 1;
	trigger.groups = {};
	return trigger;
};

AntispamTrigger.prototype._onLoad = function() {
	var that = this;
	if(!this.winston[this.options.logLevel]) {
		this.winston.error(this.chatBot.name+"/"+this.name+": Invalid log level selected. Level set to info.");
		this.options.logLevel = "info";
	}
	setInterval(function(){that._reducePenalties()},this.options.ptimer.resolution);
	return true;
}
// Return true if a message was sent
AntispamTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

AntispamTrigger.prototype._respond = function(toId,userId,message) {
	var that = this;
	if(!trigger.groups[toId]) {
		trigger.groups[toId] = {};
	}
	if(!trigger.groups[toId][userId]) {
		trigger.groups[toId][userId] = 0;
	}
	for(var badword in this.options.badwords) {
		if(message.toLowerCase().indexOf(badword.toLowerCase()) > -1) {
			trigger.groups[toId][userId] += this.options.badwords[badword] || this.options.msgPenalty;
		}
	}
	this.groups[toId][userId] += this.options.msgPenalty;
	if(this.groups[toId][userId] >= this.options.score.warn) {
		this.winston[this.options.logLevel](this.chatBot.name+"/"+this.name+": warning "+this._username(userId)+" for spamming in http://steamcommunity.com/gid/"+toId);
		this._sendMessageAfterDelay(userId,this.options.warnMessage);
	}
	if(this.groups[toId][userId] >= this.options.score.kick) {
		this.winston[this.options.logLevel](this.chatBot.name+"/"+this.name+": kicking "+this._username(userId)+" for spamming in http://steamcommunity.com/gid/"+toId);
		this.chatBot.kick(toId,userId);
	}
	if(this.groups[toId][userId] >= this.options.score.ban) {
		this.winston[this.options.logLevel](this.chatBot.name+"/"+this.name+": banning "+this._username(userId)+" for spamming in http://steamcommunity.com/gid/"+toId);
		this.chatBot.ban(toId,userId);
		setTimeout(function(){
			that.winston[that.options.logLevel](that.chatBot.name+"/"+that.name+": unbanning "+that._username(userId)+" from http://steamcommunity.com/gid/"+toId);
			that.chatBot.unban(toId,userId);
		},trigger.options.timers.unban);
	}
	if(this.groups[toId][userId] >= this.options.score.ignore) {
		this.winston[this.options.logLevel](this.chatBot.name+"/"+this.name+": ignoring "+this._username(userId));
		this.chatBot.ignores.push(userId);
		setTimeout(function(){
			that.winston[that.options.logLevel](that.chatBot.name+"/"+that.name+": unignoring "+that._username(userId)+"");
			that.chatBot.ignores.splice(that.chatBot.ignores.indexOf(userId));
		},trigger.options.timers.unignore);
	}
	if(this.groups[toId][userId] >= this.options.score.tattle) {
		this.winston[this.options.logLevel](this.chatBot.name+"/"+this.name+": tattling on "+this._username(userId)+" for spamming in http://steamcommunity.com/gid/"+toId);
		this._sendMessageAfterDelay(admin,this._username(userId)+" is spamming in http://steamcommunity.com/gid/"+toId);
	}
}

AntispamTrigger.prototype._stripCommand = function(message, command){
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return message.substring(command.length+1);
	}
	return false;
}

AntispamTrigger.prototype._username = function(steamId) {
	return ((this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates) ? this.chatBot.steamFriends.personaStates[steamId].player_name : steamId)
}
AntispamTrigger.prototype._reducePenalties = function() {
	this.winston.debug(this.chatBot.name+"/"+this.name+": Reducing scores");
	for(var group in this.groups) {
		for(var user in this.groups[group]) {
			this.groups[group][user] -= this.options.ptimer.amount;
			if(this.groups[group][user] <= 0) {
				delete this.groups[group][user];
			}
		}
	}
}
