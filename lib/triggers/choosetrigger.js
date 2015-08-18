var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
 
// A working command, where the bot will Choose one "word" from the following string as a winner, example:
// !Choose Water Soda Wine
// "I have chosen Water."
/*
    {
        name: "ChooseTrigger",
        type: "ChooseTrigger",
        options: {
            command: "!choose",
            delay: 1000,
            timeout: 30*1000,
        }
    }
*/
 
var ChooseTrigger = function() {
    ChooseTrigger.super_.apply(this, arguments);
};
 
util.inherits(ChooseTrigger, BaseTrigger);
 
 
var type = "ChooseTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
    var trigger = new ChooseTrigger(type, name, chatBot, options);
    trigger.options.command = trigger.options.command || "!choose";
    return trigger;
}
 
// Return true if a message was sent
ChooseTrigger.prototype._respondToFriendMessage = function(userId, message) {
    return this._respond(userId, message);
}
 
// Return true if a message was sent
ChooseTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
    return this._respond(roomId, message);
}
 
ChooseTrigger.prototype._respond = function(toId, message) {
    var result = this._stripCommand(message, this.options.command);
    if (result) {
        var removed = [];
        for(var i = 1; i < result.params.length; i++) {
            removed.push(result.params[i]);
        }
        var choice = Math.floor(Math.random() * removed.length);
        this._sendMessageAfterDelay(toId, 'I have chosen ' + removed[choice]);
        return true;
    }
    return false;
}
 
ChooseTrigger.prototype._stripCommand = function(message, command) {
    if (command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
        return {message: message, params: message.split(" ")};
    }
    else if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
        return {message: message, params: message.split(" ")};
    }
    return null;
}
