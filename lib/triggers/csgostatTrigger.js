const BaseTrigger = require('./baseTrigger.js').BaseTrigger;
const _ = require('lodash');
const Moment = require('moment');

const util = require('util');

//Trigger that queries steamapi for a players csgo stats
//Similar to csgo-stats.com
//command - defaults to !csgostats
//apiKey - put it in the trigger options or globally in chatbot options
var CSGOStatTrigger = function() {
	CSGOStatTrigger.super_.apply(this, arguments);
}

util.inherits(CSGOStatTrigger, BaseTrigger);

const type = 'CSGOStatTrigger';
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new CSGOStatTrigger(type, name, chatBot, options);
	trigger.options.command = trigger.options.command || '!csgostats';
	trigger.options.apiKey = trigger.options.apiKey || (chatBot.apikey || undefined);
	return trigger;
}

CSGOStatTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

CSGOStatTrigger.prototype._respondToFriendMessage = function(userId, userId, message) {
	return this._respond(userId, userId, message);
}

CSGOStatTrigger.prototype._respond = function(toId, userId, message) {
	const query = this._stripCommand(message, this.options.command);
	if(query && query.params.length === 2) {
		this.chatBot.steamApi('ISteamUserStats', 'GetUserStatsForGame', 2, 'get', this.options.apiKey, {
			steamid: query.params[1],
			appid: "730"
		}).then(body => {
			try {
				console.log('Attempting to get info...');
				const stats = body.playerstats.stats;

				const totalKills = _.where(stats, { "name": "total_kills" })[0].value;
				const totalDeaths = _.where(stats, { "name": "total_deaths" })[0].value;

				const shotsHit = _.where(stats, { "name": "total_shots_hit" })[0].value;
				const shotsFired = _.where(stats, { "name": "total_shots_fired" })[0].value;

				const matchesWon = _.where(stats, { "name": "total_matches_won" })[0].value;
				const matchesTotal = _.where(stats, { "name": "total_matches_played" })[0].value;

				const timePlayed = _.where(stats, { "name": "total_time_played" })[0].value;
				const date = Moment.duration(timePlayed, 'seconds');
				const hours = Math.floor(date.asHours());
				const minutes = Math.floor(date.asMinutes()) - (hours * 60);

				const headshots = _.where(stats, { "name": "total_kills_headshot" })[0].value;

				const windows = _.where(stats, { "name": "total_broken_windows" })[0].value;

				const kdRatio = totalKills / totalDeaths;
				const accuracy = shotsHit / shotsFired;
				const winRatio = matchesWon / matchesTotal;
				this._sendMessageAfterDelay(toId, `${this.chatBot.steamFriends.personaStates[body.playerstats.steamID].player_name} (${body.playerstats.steamID}) has ${totalKills} kills and ${totalDeaths} deaths (${kdRatio.toFixed(2)}), accuracy of ${accuracy.toFixed(2)}, win percentage of ${winRatio.toFixed(3)*100}%, total playtime of ${hours.toFixed(0)} hours and ${minutes.toFixed(0)} minutes, ${headshots} headshots, and has broken ${windows} windows.`);
			}
			catch(e) {
				this.winston.error(this.chatBot.name + '/' + this.name + ': Error: ' + e.stack);
				this._sendMessageAfterDelay(toId, 'Error: ' + e.message);
			}
		}).catch(error => {
			this.winston.error(this.chatBot.name + '/' + this.name + ': Error: ' + e.stack);
			this._sendMessageAfterDelay(toId, 'Error: ' + e.message);
		});
		return true;
	}
	else {
		return false;
	}
}

CSGOStatTrigger.prototype._stripCommand = function(message, command) {
	if(command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return {
			message: message,
			params: message.split(' ')
		};
	}
}

