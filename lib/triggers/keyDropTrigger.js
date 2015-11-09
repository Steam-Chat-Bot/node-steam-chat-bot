var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var fs = require('fs');
var fnd = require('filendir');
/*
Trigger that stores keys for keydrops in a given groupchat. Attempts to join the groupchat before sending the message to make sure chat hasn't crashed.
Options:
users        - Array[String]     = array of users allowed to use commands
room         - string            = room(steamid64) this command is associated with
dropCommand  - string(!keydrop)  = command to drop a key
dropChance   - float(0)          = chance that the bot will drop a key randomly (per-message). Probably keep this low. valid values 0-1. 0-0.02 is probably good. (0.02 is 1 in 50 chance)
addCommand   - string(!keyadd)   = command to add a key
queueCommand - string(!keysleft) = command to check how many keys are left
timer        - int(3000)         = delay before key is sent, in ms. Defaults to 3s.
dbFile       - string            = database file. This is a flatfile containing json. Defaults to BOTNAME/TRIGGERNAME.db.
*/

var KeyDropTrigger = function() {
	KeyDropTrigger.super_.apply(this, arguments);
};

util.inherits(KeyDropTrigger, BaseTrigger);

var type = "KeyDropTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new KeyDropTrigger(type, name, chatBot, options);
		trigger.options.dropChance = options.dropChance || 0;
		trigger.options.room = options.room || undefined;
		trigger.options.dropCommand = options.dropCommand || "!keydrop";
		trigger.options.addCommand = options.addCommand || "!keyadd";
		trigger.options.queueCommand = options.queueCommand || "!keysleft";
		trigger.options.timer = options.timer || 3*1000;
		trigger.options.dbFile = options.hasOwnProperty('dbFile') ? options.dbFile : chatBot.name + '/' + name + ".db";
		trigger.respectsMute = false;
		trigger.keys = (function(){try{return JSON.parse(fs.readFileSync(trigger.options.dbFile));}catch(err){return []}})();
	return trigger;
};

// Return true if a message was sent
KeyDropTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
KeyDropTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

KeyDropTrigger.prototype._respond = function(roomId, userId, message) {
	var that = this;
	var toId = roomId || userId;
	var query = this._stripCommand(message, this.options.addCommand);
	if (query && query.params[1]) {
		query.params.splice(0,1); //dump the command.
		var key = query.params.join(" ");
		this.keys.push(key);
		if(fnd.ws(this.options.dbFile,JSON.stringify(this.keys))) { //this should be changed to a database soon.
			this._sendMessageAfterDelay(userId, "\""+key+"\" has been added to the end of the queue");
		} else {
			this._sendMessageAfterDelay(userId, "\""+key+"\" has been added to the end of the queue, however saving the queue to disk has failed. You may wish to ensure the key has been dropped later and/or posting it elsewhere.");
			this.winston.error("Could not write keys to disk",key);
		}
		return true;
	}
	if(this._stripCommand(message, this.options.queueCommand)) {
		this._sendMessageAfterDelay(roomId, "There are "+this.keys.length+" keys left in the queue");
		return true;
	}
	var query = this._stripCommand(message, this.options.dropCommand);
	if (query || Math.random() < this.options.dropChance) {
		if(this.keys.length===0) {
			if(query) { this._sendMessageAfterDelay(userId, "There are no keys left in the queue"); }
			return true;
		}
		if(query) { this._sendMessageAfterDelay(userId, "Making sure I'm in the groupchat. The next key in the queue will be dropped in a few seconds."); }
		this.chatBot.joinChat(this.options.room);
		var key = this.keys.splice(0,1)[0]; // grab the next key
		setTimeout(function(){
			that._sendMessageAfterDelay(that.options.room, key); //send the message
			that.winston.info("\""+key+"\" has been removed from the beginning of the queue");
			if(fnd.ws(that.options.dbFile,JSON.stringify(that.keys))) { //this should be changed to a database soon.
				if(query) {
					that._sendMessageAfterDelay(userId, "\""+key+"\" has been removed from the beginning of the queue");
				}
			} else {
				if(query) { that._sendMessageAfterDelay(userId, "\""+key+"\" has been removed from the queue, however saving the queue to disk has failed."); }
				that.winston.error("Could not write keys to disk. Removed key: "+key);
			}
		},that.options.timer);

		return true;
	}
	return false;
}

KeyDropTrigger.prototype._stripCommand = function(message,command) {
	if (command && message && message.toLowerCase().indexOf(command.toLowerCase() + " ") === 0) {
		return {message: message, params: message.split(" ")};
	}
	if (command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
