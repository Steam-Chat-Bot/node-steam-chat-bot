var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var ueberDB = require("ueberDB");
/*
A Karma trigger. thing++ increases karma, thing-- decreases it. Spaces are ignored/removed.
options:
command = string or array of strings (optional) - what is the command for the given function?
ueberDB = ueberDB - an *initiated* instance of ueberDB https://github.com/Pita/ueberDB if you don't want to use an sqlite db, or if you don't want to share it.
dbFile = string - path to the sqlite.db file that you want to use.
maxlength = int - what is the maximum length of a key? Default is 25.
*/

var KarmaTrigger = function() {
	KarmaTrigger.super_.apply(this, arguments);
};

util.inherits(KarmaTrigger, BaseTrigger);

var type = "KarmaTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new KarmaTrigger(type, name, chatBot, options);
	trigger.options.command   = trigger.options.command || "!karma";
	trigger.options.maxlength = options.maxlength       || 25;
	trigger.db = options.ueberDB || new ueberDB.database("sqlite", {filename:options.dbFile||(chatBot.name+"/"+name+".db")}, {writeInterval:500});
	trigger.dbInitialized=false;
	return trigger;
};

KarmaTrigger.prototype._respondToFriendMessage = function(userId, message) {
	if(this._stripCommand(message)) {
		this._respondToChatMessage(userId,userId,message);
	}
	return false;
}

// Return true if a message was sent
KarmaTrigger.prototype._respondToChatMessage = function(roomId, chatterId, m) {
	var that = this;
	var cmd = this._stripCommand(m);
	if(cmd) {
		this._dbOperation('get',{key:cmd.replace(/\s/g,'').toLowerCase(),callback:function(err,value){
			if(err) {
				that._sendMessageAfterDelay(roomId,"Error obtaining karma for '"+cmd+"'.");
				that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err);
				return;
			}
			that._sendMessageAfterDelay(roomId,"'"+cmd+"' has "+(value||"no")+" karma.");
		}});
		return true;
	}
	if(m.replace(/\s/g,'').length-2 > this.options.maxlength) {
		return false;
	}
	if(m.length>2 && m.length < this.options.maxlength && m.indexOf("++")===m.length-2) {
		this._changeScore(m.substr(0,m.length-2).replace(/\s/g,''),1);
	}
	if(m.length>2 && m.length < this.options.maxlength && m.indexOf("--")===m.length-2) {
		this._changeScore(m.substr(0,m.length-2).replace(/\s/g,''),-1);
	}
	return false;
}

KarmaTrigger.prototype._dbOperation = function(type, details) {
	var that = this;
	this.winston.spam(this.chatBot.name+"/"+this.name+": "+type,details);
	if(this.dbInitialized === false) {
		this.db.init(function(err){
			if(err) {
				that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err);
			} else {
				that.dbInitialized=true;
				that._dbOperation(type, details);
			}
		});
	} else if(type === "set") {
		that.winston.debug(this.chatBot.name+"/"+this.name+": Setting!");
		this.db.set(details.key, details.value);
	} else if(type === "get") {
		this.db.get(details.key, details.callback);
	}
}
KarmaTrigger.prototype._changeScore = function(key,amount,cb) {
	var that = this;
	var callback = function(err,value){
		if(err) {
			that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err);
			return;
		} else if(!value) {
			value = 0;
		}
		var details = {
			key: key,
			value: value+amount,
			callback:cb
		}
		that._dbOperation('set', details);
	}
	this._dbOperation('get',{key:key,callback:callback});
}
KarmaTrigger.prototype._stripCommand = function(message, command){
	var that = this;
	var command = command || this.options.command;
	if (command && typeof command === "string" && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return(message.substr(command.length+1));
	} else if(command instanceof Array) {
		for(var x=0;x<command.length;x++){
			if(message.toLowerCase().indexOf(command[x].toLowerCase()) === 0) {
				return that._stripCommand(message, command[x]);
			}
		}
	}
	return null;
}
