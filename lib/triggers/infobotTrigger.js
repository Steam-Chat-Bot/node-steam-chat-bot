var util = require('util');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
}
/*
An infobot trigger. Does not learn on its own (e.g. things need to be defined with !learn)
options:
commands = string or array of strings (optional) - what is the command for the given function?
	cmdLearn - default '!learn' - !learn X is Y
	cmdTell - default 'what is' - What is X?
	cmdLock - default '!lockword' - !lockword X
	cmdUnlock - default '!unlockword' - !unlockword X
	cmdFull - default '!wordinfo' - shows all information on command. Who changed it last, when, etc.
admin = string or Array - steamid64(s) of those allowed to lock/unlock values
userlearn = bool - are regular users allowed to make the bot learn stuff? defaults to true
command = string - command to change the message. Defaults to !status
*/

var InfobotTrigger = function() {
	InfobotTrigger.super_.apply(this, arguments);
};

util.inherits(InfobotTrigger, BaseTrigger);

var type = "InfobotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new InfobotTrigger(type, name, chatBot, options);
	trigger.options.userlearn = trigger.options.userlearn || true;
	trigger.options.cmdLearn = trigger.options.cmdLearn || "!learn";
	trigger.options.cmdTell = trigger.options.cmdTell || ["what is","who is"];
	trigger.options.cmdLock = trigger.options.cmdLock || '!lockword';
	trigger.options.cmdUnlock = trigger.options.cmdUnlock || '!unlockword';
	trigger.options.cmdInfo = trigger.options.cmdInfo || '!wordinfo';
	trigger.options.location = trigger.options.location || './bot.'+chatBot.username+'.storage/'+type+'/'+name;
	try{ //node-localstorage doesn't make parent directories. BOO. I refuse to look up how to do this properly, we'll just require mkdirp instead.
		trigger.store = new LocalStorage(trigger.options.location);
	}catch(err){
		require('mkdirp').sync(trigger.options.location);
		trigger.store = new LocalStorage(trigger.options.location);
	}
	return trigger;
};

InfobotTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
InfobotTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

InfobotTrigger.prototype._respond = function(toId,userId,message) {
//console.log(this.options.cmdLearn + (this.options.cmdLearn==message.split(' ')[0] ? " == " : " != ") + message.split(' ')[0]);
try{
	var msg = this._stripCommand(message, this.options.cmdLearn);
	if(msg && msg.pair.length==2 && (this.options.userlearn==true || this.options.admin==userId || userId in this.options.admin)) {
		if(this.store.getItem(msg.pair[0]) && JSON.parse(this.store.getItem(msg.pair[0])).locked==true) {
			this._sendMessageAfterDelay(toId, "That factoid is locked!");
			return true;
		}
		this.store.setItem(msg.pair[0],JSON.stringify({word:msg.pair[0],definition:msg.pair[1],author:userId,time:(new Date()-0),locked:false}));
		console.log(this.store.getItem(msg.pair[0]));
		this._sendMessageAfterDelay(toId, "Learned: "+msg.pair[0]+" is "+msg.pair[1]);
		return true;
	}
	msg = this._stripCommand(message, this.options.cmdTell);
	if(msg && this.store.getItem(msg.pair[0])) {
		var factoid = this.store.getItem(msg.pair[0]);
		if(factoid) {
			factoid = JSON.parse(factoid);
			this._sendMessageAfterDelay(toId, factoid.word+" is "+factoid.definition);
			return true;
		} else return false;
	}
	msg = this._stripCommand(message, this.options.cmdLock);
	if(msg && (!this.options.admin || (this.options.admin==userId||userId in this.options.admin))) {
		var factoid = this.store.getItem(msg.pair.splice(0));
		if(factoid) {
			var factoid=JSON.parse(factoid);
			factoid.locked=true;
			this.store.setItem(factoid.word,JSON.stringify(factoid));
			this._sendMessageAfterDelay(toId, "Locked "+factoid.word);
			return true;
		} else {
			this._sendMessageAfterDelay(toId, "No such factoid");
			return true;
		}
	}
	msg = this._stripCommand(message, this.options.cmdUnlock);
	if(msg && (!this.options.admin || (this.options.admin==userId||userId in this.options.admin))) {
		var factoid = this.store.getItem(msg.pair.splice(0));
		if(factoid) {
			factoid=JSON.parse(factoid);
			factoid.locked=false;
			this.store.setItem(factoid.word,JSON.stringify(factoid));
			this._sendMessageAfterDelay(toId, "Unlocked "+factoid.word);
			return true;
		} else {
			this._sendMessageAfterDelay(toId, "No such factoid");
			return true;
		}
	}
	msg = this._stripCommand(message, this.options.cmdInfo);
	if(msg) {
		var factoid = this.store.getItem(msg.pair.splice(0));
		if(factoid) {
			factoid=JSON.parse(factoid);
			var date = new Date(factoid.time);
			var who = ((this.chatBot.steamClient.users && factoid.author in this.chatBot.steamClient.users) ? (this.chatBot.steamClient.users[factoid.author].playerName + "/"+factoid.author) : "http://steamcommunity.com/profiles/"+factoid.author);
			this._sendMessageAfterDelay(toId, factoid.word+" was last modified by " + who + " at "+date.toLocaleTimeString()+" on "+date.toDateString());
			return true;
		} else {
			this._sendMessageAfterDelay(toId, "No such factoid");
			return true;
		}
	}
	return false;
}catch(err){console.log(err.stack);}
}
InfobotTrigger.prototype._stripCommand = function(message, command){
	var that = this;
	if (command && typeof command=="string" && message && message.toLowerCase().indexOf(command.toLowerCase())==0) {
		return {message: message, params: message.split(' '), pair: message.substring(command.length + 1).split(' is ')};
	} else if(command instanceof Array) {
		for(x=0;x<command.length;x++){
			if(message.toLowerCase().indexOf(command[x].toLowerCase())==0)
				return that._stripCommand(message, command[x]);
		}
	}
	return null;
}
