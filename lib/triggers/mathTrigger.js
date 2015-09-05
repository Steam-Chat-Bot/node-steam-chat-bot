var util = require('util');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var math = require('mathjs');
/* 
 * Another day we dream of having algebra,
 * But today is not that day...
var Algebra = require('algebra.js');
var Fraction = Algebra.Fraction;
var Expression = Algebra.Expression;
var Equation = Algebra.Equation;
*/

var MathTrigger = function() {
	MathTrigger.super_.apply(this, arguments);
}

util.inherits(MathTrigger, BaseTrigger);

var type = 'MathTrigger';
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new MathTrigger(type, name, chatBot, options);
	trigger.options.command = trigger.options.command || '!math';
	//trigger.options.algcommand = trigger.options.algcommand || '!algebra'; //above
	return trigger;
}

MathTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

MathTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

MathTrigger.prototype._respond = function(toId, userId, message) {

	var query = this._stripCommand(message, this.options.command);
	if(query) {
		var removed = [];
		for(var i = 1; i < query.params.length; i++) {
			removed.push(query.params[i]);
		}
		try {
			this._sendMessageAfterDelay(toId, (math.eval(removed.join(' ')).toString()));
			return true;
		}
		catch(e) {
			this.winston.error(e.stack);
			this._sendMessageAfterDelay(toId, e.message);
		}
	}
	return false;
}

MathTrigger.prototype._stripCommand = function(message, command) {
	if(command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return { 
			message: message, 
			params: message.split(' ') 
		}
	}
	return null;
}
