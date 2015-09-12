var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var vm = require("vm");
/*
Trigger that evaluates code, optionally in the *current* context.
WARNING: Please note that while the default is to run *outside* of the current context, this is still unsafe. Running it in the current global context
	will allow you to modify the bot objects, which can be dangerous, but also useful--you can load triggers, etc.
command = string - a message must start with this + a space before a response will be given
evalUnsafe = bool(false) - if true, code will be run in the current global context; otherwise it will be run in a new context (vm.runInThisContext vs vm.runInNewContext).
evalOpts = Object - passed to vm.runIn(This|New)Context.
evalOpts.timeout = int(1000) - how many ms will the code be allowed to run? If execution is terminated, an Error() will be thrown.
evalOpts.displayErrors = bool(true) - whether or not to print any errors to stderr, with the line of code that caused them highlighted, before throwing
	an exception. Will capture both syntax errors from compiling code and runtime errors thrown by executing the compiled code.
evalOpts.filename = string(evalTrigger.js) - allows you to control the filename that shows up in any stack traces produced.
*/

var EvalTrigger = function() {
	EvalTrigger.super_.apply(this, arguments);
};

util.inherits(EvalTrigger, BaseTrigger);

var type = "EvalTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new EvalTrigger(type, name, chatBot, options);
	trigger.options.command    = options.command    || "!eval";
	trigger.options.evalUnsafe = options.evalUnsafe || false;
	trigger.options.evalOpts   = options.evalOpts   || {};
	trigger.options.evalOpts.timeout       = options.evalOpts.hasOwnProperty('timeout')       ? options.evalOpts.timeout       : 1000;
	trigger.options.evalOpts.displayErrors = options.evalOpts.hasOwnProperty('displayErrors') ? options.evalOpts.displayErrors : true;
	trigger.options.evalOpts.filename      = options.evalOpts.filename || "evalTrigger.js";
	return trigger;
};

// Return true if a message was sent
EvalTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
EvalTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}


EvalTrigger.prototype._respond = function(roomId, userId, message) {
	var that = this;
	var cmd = that._stripCommand(message);
	if(!cmd) {
		return false;
	}
	that.winston.info(that.chatBot.name+"/"+that.name+": Evaluating for user...");
	try {
		var vmResult;
		if(that.options.evalUnsafe) {
			vmResult = eval(cmd);
		} else {
			this.context = vm.createContext({});
			vmResult = vm.runInContext(cmd,that.options.evalOpts);
		}
		if(vmResult !== undefined) {
			that._sendMessageAfterDelay(roomId,vmResult.toString());
		}
	} catch(err) {
		that.winston.error(err.stack);
	}
}

EvalTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}
