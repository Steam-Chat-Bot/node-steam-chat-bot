var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Punishes spammers. Assigns a penalty to every message in a groupchat, and when a certain score is reached, it penalizes the user.
Options:
ignores - array of strings([]) = users that won't be penalized (trigger effectively won't see them). You probably want to put yourself here, as admins aren't treated specially. (this is a built-in)
logLevel - string(info) = what level should we log at? Choose a level from the top of chatBot.js
admins - array of strings([]) = admins that the bot tattles to. You probably want to put yourself here. This function doesn't differentiate between users and
				groupchats, so you can have it report to a groupchat as well. Can be an array [sid,sid] or an object {name:id,name:id} for readability.
score - object = at what score should a certain action be taken?
score.warn - int(3) = when should we warn the user?
score.warnMax - int(5) = when should we *stop* warning the user? Defaults to score.kick-1.
score.kick - int(6) = when should we kick the user?
score.ban - int(8) = when should we ban the user?
score.ignore - int(10) = when should we add the user to the global ignore list
score.tattle - int(4) = when should we tell the admins?
score.tattleMax - int(5) = when should we *stop* tattling to admins (clearly they don't care or aren't here, don't spam them). Defaults to score.tattle+1.
msgPenalty - int(1) = how much should we add to a user's score on each message?
timers - object = timer setup. Mostly how many timer cycles should we perform certain actions after (ie how long punishments last)
timers.messages - int(5*1000=5sec) = timeout (in ms) for messages. The bot will not warn or tattle on a user more than once every X milliseconds.
					Set explicitly to false to disable timeouts. Timeouts for warning/tattling are separate.
timers.unban - int(5*60*1000=5min) = when should we unban a user?
timers.unignore - int(5*60*1000) = when should we unignore?
ptimer - object = use this to control how fast the score decreases, ie if you want to reset the score entirely or just decrease it.
ptimer.resolution - int(1000=1s) = How many milliseconds between decreasing the score?
ptimer.amount - int(1) = how much to decrease the score each time?
badwords - object = assign custom score to bad words. Set a penalty to null to use the default penalty. Per-message penalty will also apply.
			You'll probably want to adjust the warnMessage if you set this. For example - badwords: { fudge:10, sucks:5, "eat me":null }
TODO: Use cache to save punishments and revert them during onload; don't keep punishments if the bot crashes
debug - bool(false) = should we spam your log every time we reduce scores? Turn this on if you think something's not working right.
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
	trigger.options.score.warnMax     = options.score.warnMax     || options.score.kick-1 || 5;
	trigger.options.score.kick        = options.score.kick        || 6;
	trigger.options.score.ban         = options.score.ban         || 8;
	trigger.options.score.ignore      = options.score.ignore      || 10;
	trigger.options.score.tattle      = options.score.tattle      || 4;
	trigger.options.score.tattleMax   = options.score.tattleMax   || options.score.tattle+1 || 5;
	trigger.options.timers            = options.timers            || {};
	trigger.options.timers.messages   = options.timers.hasOwnProperty('messages') ? options.timers.messages : 5000;
	trigger.options.timers.unban      = options.timers.unban      || 5*60*1000;
	trigger.options.timers.unignore   = options.timers.unignore   || 5*60*1000;
	trigger.options.warnMessage       = options.warnMessage       || "Spamming is against the rules!";
	trigger.options.ptimer            = options.ptimer            || {};
	trigger.options.ptimer.resolution = options.ptimer.resolution || 1000;
	trigger.options.ptimer.amount     = options.ptimer.amount     || 1;
	trigger.options.msgPenalty        = options.msgPenalty        || 1;
	trigger.options.debug             = options.debug             || false;
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
AntispamTrigger.prototype._log = function(prefix,userId,groupId,reason) {
	var message = this.chatBot.name+"/"+this.name+": "+prefix+this._username(userId)+" for spamming in https://steamcommunity.com/gid/"+groupId;
	if(reason) { message+=" to prevent spam ("+reason+")"; }
	this.winston[this.options.logLevel](message);
}
AntispamTrigger.prototype._respond = function(toId,userId,message) {
	var that = this;
	if(!this.groups[toId]) {
		this.groups[toId] = {};
	}
	if(!this.groups[toId][userId]) {
		this.groups[toId][userId] = 0;
	}
	for(var badword in this.options.badwords) {
		if(message.toLowerCase().indexOf(badword.toLowerCase()) > -1) {
			this.groups[toId][userId] += this.options.badwords[badword] || this.options.msgPenalty;
		}
	}
	this.groups[toId][userId] += this.options.msgPenalty;
	if(this.groups[toId][userId] >= this.options.score.warn && this.groups[toId][userId] <= this.options.score.warnMax) {
		if(!this.groups[toId][userId+"warned"]) {
			this._log("warning",userId,toId);
			this._sendMessageAfterDelay(userId,this.options.warnMessage);
			if(this.options.timers.messages) {
				this.groups[toId][userId+"warned"]=true;
				setTimeout(function(){that.groups[toId][userId+"warned"]=false},this.options.timers.messages);
			}
		} else {
			this._log("NOT warning",userId,toId,"timeout");
		}
	} else if (this.groups[toId][userId] >= this.options.score.warn) {
		this._log("NOT warning",userId,toId,"counter");
	}
	if(this.groups[toId][userId] >= this.options.score.kick) {
		this._log("kicking",userId,toId);
		this.chatBot.kick(toId,userId);
	}
	if(this.groups[toId][userId] >= this.options.score.ban) {
		this._log("banning",userId,toId);
		this.chatBot.ban(toId,userId);
		setTimeout(function(){
			that._log("**UNbanning**",userId,toId);
			that.chatBot.unban(toId,userId);
		},this.options.timers.unban);
	}
	if(this.groups[toId][userId] >= this.options.score.ignore) {
		this._log("ignoring",userId,toId);
		this.chatBot.ignores.push(userId);
		setTimeout(function(){
			that._log("**UNignoring**",userId,toId);
			that.chatBot.ignores.splice(that.chatBot.ignores.indexOf(userId));
		},this.options.timers.unignore);
	}
	if(this.groups[toId][userId] >= this.options.score.tattle && this.groups[toId][userId] <= this.options.score.tattleMax) {
		if(this.groups[toId][userId+"tattled"]) {
			this._log("NOT tattling",userId,toId,"timeout");
			return;
		}
		this._log("tattling on",userId,toId);
		for(var admin in this.options.admins) {
			this._sendMessageAfterDelay(this.options.admins[admin],this._username(userId)+" is spamming in https://steamcommunity.com/gid/"+toId);
		}
		if(this.options.timers.messages) {
			this.groups[toId][userId+"tattled"]=true;
			setTimeout(function(){that.groups[toId][userId+"tattled"]=false},this.options.timers.messages);
		}
	} else if(this.groups[toId][userId] >= this.options.score.tattle) {
		this._log("NOT tattling",userId,toId,"counter");
	}
}

AntispamTrigger.prototype._stripCommand = function(message, command){
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return message.substring(command.length+1);
	}
	return false;
}

AntispamTrigger.prototype._username = function(steamId) {
	if(this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates) {
		return this.chatBot.steamFriends.personaStates[steamId].player_name;
	}
	return steamId;
}
AntispamTrigger.prototype._reducePenalties = function() {
	if(this.options.debug){
		this.winston.debug(this.chatBot.name+"/"+this.name+": Reducing scores");
	}
	for(var group in this.groups) {
		for(var user in this.groups[group]) {
			this.groups[group][user] -= this.options.ptimer.amount;
			if(this.groups[group][user] <= 0) {
				delete this.groups[group][user];
			}
		}
	}
}
