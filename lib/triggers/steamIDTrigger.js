const BaseTrigger = require('./baseTrigger.js').BaseTrigger;
const _ = require('lodash');

const util = require('util');

var SteamIDTrigger = function() {
	SteamIDTrigger.super_.apply(this, arguments);
}

util.inherits(SteamIDTrigger, BaseTrigger);

const type = 'SteamIDTrigger';
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new SteamIDTrigger(type, name, chatBot, options);
	trigger.options.command = trigger.options.command || '!steamid';
	return trigger;
}

SteamIDTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

SteamIDTrigger.prototype._respondToFriendMessage = function(userId, userId, message) {
	return this._respond(userId, userId, message);
}

SteamIDTrigger.prototype._respond = function(toId, userId, message) {
	const query = this._stripCommand(message, this.options.command);
	if(query && query.params.length === 2) {
		const re = new RegExp(query.params[1], 'ig');
		const friend = _.find(this.chatBot.steamFriends.personaStates, (value, key) => {
			return value.player_name.match(re);
		});
		try {
			this._sendMessageAfterDelay(toId, `${friend.player_name}'s steamID is ${friend.friendid}.`);
		}
		catch(e) {
			this.winston.error(`${this.chatBot.name}/${this.name}: Error: ${e.stack}`);
			this._sendMessageAfterDelay(toId, `Error: ${e.message}`);
		}
	}
}

SteamIDTrigger.prototype._stripCommand = function(message, command) {
	if(command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return {
			message: message,
			params: message.split(' ')
		};
	}
}
