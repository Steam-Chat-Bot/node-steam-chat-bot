var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
}
/*
Trigger that sends a status message in public or private to anyone joining the chat. Use rooms:[] in options to limit it to one groupchat.
options:
admin = string - steamid64 of those allowed to change the status message. If not defined, anyone can change it.
command = string - command to change the message. Defaults to !status
locate = string - where to store the statuses on disk. Defaults to ./BOTNAME/StatusTrigger/TRIGGERNAME
	if you need storages to be shared, set them to `myBot.name + "/StatusTrigger"` or some such.
public = bool - send the message to the joining user, or to the chat? To the chat if true (default), to the user if false.
*/

var StatusTrigger = function() {
	StatusTrigger.super_.apply(this, arguments);
};

util.inherits(StatusTrigger, BaseTrigger);

var type = "StatusTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new StatusTrigger(type, name, chatBot, options);
	trigger.respectsMute = false;
	trigger.options.command = trigger.options.command   || "!status";
	trigger.options.location = options.location         || (process.cwd()+"/"+chatBot.name + "/"+type);
	trigger.options.public = options.public             === false ? false : true;
	try{ //node-localstorage doesn't make parent directories. BOO. I refuse to look up how to do this properly, we'll just require mkdirp instead.
		trigger.store = new LocalStorage(trigger.options.location);
	}catch(err){
		var location = trigger.options.location.split("/");
		location.splice(location.length-1);
		require("mkdirp").sync(location.join("/"));
		trigger.store = new LocalStorage(trigger.options.location);
	}
	trigger.allowMessageTriggerAfterResponse = true;
	return trigger;
};

StatusTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
StatusTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

StatusTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	if(this.store.getItem(roomId)) {
		this._sendMessageAfterDelay((options.public ? roomId : userId), this.store.getItem(roomId));
		return true;
	}
	return false;
}

StatusTrigger.prototype._respond = function(toId,userId,message) {
	var msg = this._stripCommand(message, this.options.command);
	if(((this.options.admin && this.options.admin===userId) || !this.options.admin) && msg) {
		msg.params.splice(0,1);
		this.store.setItem(toId,msg.params.join(" "));
		this._sendMessageAfterDelay(toId, "Status changed!\n"+this.store.getItem(toId));
		return true;
	}
	return false;
}

StatusTrigger.prototype._stripCommand = function(message, command) {
	if (this.options.command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
