var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var ueberDB = require("ueberDB");
var Random = require("random-js");
var random = new Random(Random.engines.mt19937().autoSeed());
/*
An infobot trigger. Does not learn on its own (e.g. things need to be defined with !learn)
options:
commands = string or array of strings (optional) - what is the command for the given function?
	cmdLearn - default "!learn" - !learn X is Y. Set to false to learn from everything said.
	cmdTell - default "what is" - What is X?
	cmdLock - default "!lockword" - !lockword X
	cmdUnlock - default "!unlockword" - !unlockword X
	cmdFull - default "!wordinfo" - shows all information on command. Who changed it last, when, etc.
admin = string or Array - steamid64(s) of those allowed to lock/unlock values
userlearn = bool - are regular users allowed to make the bot learn stuff? defaults to true
command = string - command to change the message. Defaults to !status
ueberDB = ueberDB - an *initiated* instance of ueberDB https://github.com/Pita/ueberDB if you don't want to use an sqlite db, or if you want to share it.
dbFile = string - path to the sqlite.db file that you want to use.
*/

var InfobotTrigger = function() {
	InfobotTrigger.super_.apply(this, arguments);
};

util.inherits(InfobotTrigger, BaseTrigger);

var type = "InfobotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new InfobotTrigger(type, name, chatBot, options);
	trigger.options.userlearn = options.hasOwnProperty("userlearn") ? options.userlearn : true;
	trigger.options.cmdDelete = trigger.options.cmdDelete  || "!unlearn";
	trigger.options.cmdLearn  = trigger.options.hasOwnProperty("cmdLearn") ? trigger.options.cmdLearn : "!learn";
	trigger.options.cmdTell   = trigger.options.cmdTell    || ["what is","who is","what are","who are"];
	trigger.options.cmdLock   = trigger.options.cmdLock    || "!lockword";
	trigger.options.cmdUnlock = trigger.options.cmdUnlock  || "!unlockword";
	trigger.options.cmdInfo   = trigger.options.cmdInfo    || "!wordinfo";
	trigger.db = options.ueberDB || new ueberDB.database("sqlite", {filename:options.dbFile||(chatBot.name+"/"+name+".db")}, {writeInterval:500});
	trigger.dbInitialized=false;
	return trigger;
};

/* db initialization will go here
InfobotTrigger.prototype._onLoad = function(){
        console.log("onload");
	return true;
}
*/
InfobotTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
InfobotTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

InfobotTrigger.prototype._dbOperation = function(type, details) {
	var that = this;
	this.winston.silly(this.chatBot.name+"/"+this.name+": dbOperating "+type,details);
	if(this.dbInitialized === false) {
		this.db.init(function(err){
			if(err) {
				that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err);
			}
			else {
				that.dbInitialized=true;
				that._dbOperation(type, details);
			}
		});
	} else if(type === "set") {
		this.db.set(details.key, details.value);
	} else if(type === "get") {
		this.db.get(details.key, details.callback);
	} else if(type === "remove") {
		that.winston.info(that.chatBot.name+"/"+that.name+": Removing!");
		this.db.remove(details.key, details.callback);
	}
}
InfobotTrigger.prototype._respond = function(toId,userId,message,options) {
	var that = this; var msg;
	if(!options) { msg = that._stripCommand(message, that.options.cmdTell); }
	if(msg || (options && options.see)) {
		that._dbOperation("get",{key:((options && options.see && options.counter < 5)?options.see : msg.pair[0].toLowerCase()),callback: function(err, value){
			if(value) {
				factoid = JSON.parse(value);
				if(!factoid.delim) {
					factoid.delim = " is ";
				}
				if(factoid.delim === " is <reply>") {factoid.word=""; factoid.delim="";}
				if(factoid.delim === " is see ") {
					that._respond(toId,userId,null,{see:factoid.definition,counter:((options && options.counter)?options.counter+1:0)});
					return true;
				} else {
					that.winston.debug(that.chatBot.name+"/"+that.name+": "+factoid.definition.length+" factoids available");
					factoid.definition = factoid.definition[random.integer(1,factoid.definition.length)-1];
					that._sendMessageAfterDelay(toId, factoid.word+factoid.delim+factoid.definition);
				}
			}
		}});
		return true;
	}
	msg = that._stripCommand(message, that.options.cmdDelete);
	if(msg && (that.options.userlearn === true || that.options.admin.indexOf(userId) > -1)) {
		that._dbOperation("get",{key: msg.pair[0].toLowerCase(), callback: function(err,value){
			if(value && JSON.parse(value).locked === true) {
				that._sendMessageAfterDelay(toId, "That factoid is locked!");
			} else if(value) {
				that._dbOperation("remove", {key:JSON.parse(value).word,callback:function(err){
					that.winston.debug(that.chatBot.name+"/"+that.name+": Removing "+JSON.parse(value).word);
					if(!err) {
						that._sendMessageAfterDelay(toId, "Removed: "+msg.pair[0]);
					} else {
						that._sendMessageAfterDelay(toId, "Error logged.");
						that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err);
					}
				}});
			}
		}});
		return true;
	}
	msg = that._stripCommand(message, that.options.cmdLock, options);
	if(msg && (!that.options.admin || (that.options.admin.indexOf(userId) > -1))) {
		that._dbOperation("get",{key:msg.pair[0],callback: function(err, value){
			if(!value) {
				that._sendMessageAfterDelay(toId, "No such factoid");
				return true;
			}
			factoid = JSON.parse(value);
			factoid.locked=true;
			that._dbOperation("set", {key:msg.pair[0],value:JSON.stringify(factoid)});
			that._sendMessageAfterDelay(toId, "Locked "+factoid.word);
			return true;
		}});
		return true;
	}
	msg = that._stripCommand(message, that.options.cmdUnlock);
	if(msg && (!that.options.admin || (that.options.admin.indexOf(userId) > -1))) {
		that._dbOperation("get",{key:msg.pair[0],callback: function(err, value){
			if(!value) {
				that._sendMessageAfterDelay(toId, "No such factoid");
				return true;
			}
			factoid = JSON.parse(value);
			factoid.locked=false;
			that._dbOperation("set", {key:msg.pair[0],value:JSON.stringify(factoid)});
			that._sendMessageAfterDelay(toId, "Unlocked "+factoid.word);
			return true;
		}});
		return true;
	}
	msg = that._stripCommand(message, that.options.cmdInfo);
	if(msg) {
		that._dbOperation("get",{key:msg.pair[0],callback: function(err, value){
			if(!value) {
				that._sendMessageAfterDelay(toId, "No such factoid");
				return true;
			}
			factoid=JSON.parse(value);
			var date = new Date(factoid.time);
			var who = ((that.chatBot.steamFriends.personaStates && factoid.author in that.chatBot.steamFriends.personaStates)
			? (that.chatBot.steamFriends.personaStates[factoid.author].player_name + "/"+factoid.author) 
			: "https://steamcommunity.com/profiles/"+factoid.author);
			that._sendMessageAfterDelay(toId, factoid.word+" was last modified by " + who + " at "+date.toLocaleTimeString()+" on "+date.toDateString()+". The full JSON value for it is: \n"+value);
		}});
		return true;
	}
	if(!this.options.cmdLearn) {
		msg = this._stripCommand("!something stupid"+message,"blah");
	} else {
		msg = this._stripCommand(message, this.options.cmdLearn);
	}
	if(msg && msg.pair.length === 2 && (that.options.userlearn === true || that.options.admin.indexOf(userId) > -1)) {
		var factoid = {
			word: msg.pair[0],
			definition: msg.pair[1].split("||"),
			delim: msg.delim,
			author: userId,
			time: (new Date()-0),
			locked: false
		}
		if(!factoid.definition.length){ return false;}
		that._dbOperation("get",{key: msg.pair[0].toLowerCase(),callback:function(err, value){
			if(!err && value && JSON.parse(value).locked === true && that.options.cmdLearn) {
				that._sendMessageAfterDelay(toId, "That factoid is locked!");
			} else {
				that._dbOperation("set",{key: msg.pair[0].toLowerCase(),value:JSON.stringify(factoid)});
				if(that.options.cmdLearn) {
					that._sendMessageAfterDelay(toId, "Learned: "+msg.pair[0]+msg.delim+msg.pair[1]);
				}
			}
		}});
		return true;
	}
	return false;
}
InfobotTrigger.prototype._stripCommand = function(msg, command, options){
	var message = msg;
	var that = this;
	if (options||(command && typeof command === "string" && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0)) {
		if(message[message.length-1]==="?") { message = message.substring(0,message.length-1); }
		var obj = {message: message,params: message.split(" "),delim:" is <reply>"};
		var pair = message.substring(command.length+1).split(" is <reply>");
		if(pair.length === 1) { pair = message.substring(command.length+1).split(" is see "); obj.delim=" is see "; }
		if(pair.length === 1) { pair = message.substring(command.length+1).split(" is "); obj.delim=" is "; }
		if(pair.length === 1) { pair = message.substring(command.length+1).split(" are "); obj.delim=" are "; }
		obj.pair = [pair.splice(0,1)[0],pair.join(obj.delim)];
		return obj;
	} else if(command instanceof Array) {
		if(message[message.length-1] === "?") {
			message = message.substring(0,message.length-1);
		}
		for(var x=0;x<command.length;x++){
			if(message.toLowerCase().indexOf(command[x].toLowerCase()) === 0) {
				return that._stripCommand(message, command[x]);
			}
		}
	}
	return null;
}
