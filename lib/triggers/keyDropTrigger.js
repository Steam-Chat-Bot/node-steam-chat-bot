var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
Trigger that stores keys for keydrops in a given groupchat. Attempts to join the groupchat before sending the message to make sure chat hasn't crashed.
Options:
users        - Array[String] = array of users allowed to use commands
room         - string        = room(steamid64) this command is associated with
dropCommand  - string        = command to drop a key
addCommand   - string        = command to add a key
queueCommand - string        = command to check how many keys are left
timer        - int           = delay before key is sent, in ms. Defaults to 3s.
*/

var KeyDropTrigger = function() {
	KeyDropTrigger.super_.apply(this, arguments);
};

util.inherits(KeyDropTrigger, BaseTrigger);

var type = "KeyDropTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new KeyDropTrigger(type, name, chatBot, options);
		trigger.options.room = options.room || undefined;
		trigger.options.dropCommand = options.dropCommand || "!keydrop";
		trigger.options.addCommand = options.addCommand || "!keyadd";
		trigger.options.queueCommand = options.queueCommand || "!keysleft";
		trigger.options.timer = options.timer || 3*1000;
		trigger.respectsMute = false;
		trigger.keys = [];
	return trigger;
};

// Return true if a message was sent
KeyDropTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(null, userId, message);
}

// Return true if a message was sent
KeyDropTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

KeyDropTrigger.prototype._respond = function(roomId, userId, message) {
	var that = this;
	var toId = roomId || userId;
	var query = this._stripCommand(message, this.options.addCommand);
	if (query && query.params[2]) {
		query.params.splice(0,1); //dump the command.
		var key = query.params.join(" ");
		this.keys.push(key);
		this._sendMessageAfterDelay(userId, "\""+key+"\" has been added to the end of the queue");
		return true;
	}
	var query = this._stripCommand(message, this.options.dropCommand);
	if (query) {
		if(this.keys.length===0) {
			this._sendMessageAfterDelay(userId, "There are no keys left in the queue");
			return true;
		}
		this._sendMessageAfterDelay(userId, "Making sure I'm in the groupchat. The next key in the queue will be dropped in a few seconds.");
		this.chatBot.joinChat(this.options.room);
		var key = this.keys.splice(0,1)[0]; // grab the next key
		setTimeout(function(){
			that._sendMessageAfterDelay(that.options.room, key); //send the message
		},that.options.timer);

		return true;
	}
	if(this._stripCommand(message, this.options.queueCommand)) {
		this._sendMessageAfterDelay(roomId, "There are "+this.keys.length+" keys left in the queue");
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
