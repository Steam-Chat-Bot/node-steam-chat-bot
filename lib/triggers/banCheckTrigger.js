var util = require('util');
var request = require('request');
var winston = require('winston');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var TinyCache = require( 'tinycache' );
var cache = new TinyCache();
/*
Trigger that automatically checks users for a steam bans (cab, community, economy) on join, and on command
command - defaults to !bans. Set probability of 0 to disable.
cacheTime - Message will not be sent if last join was within this much time, to reduce spam. Defaults to 1 hour. Set to -1 to disable onjoin checking.
apikey - your steam api key. Can be alternatively defined for the bot globally as an option, steamapikey. Required.
onjoin - does it announce when someone joins a room with a ban? Set to true, false, or an array of chats to announce in.
*/

var BanCheckTrigger = function() {
	BanCheckTrigger.super_.apply(this, arguments);
};

util.inherits(BanCheckTrigger, BaseTrigger);

var type = "BanCheckTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new BanCheckTrigger(type, name, chatBot, options);
		trigger.respectsMute = false;
		trigger.options.command = trigger.options.command || "!bans";
		trigger.options.apikey = trigger.options.apikey || (chatBot.options.steamapikey || false); //An api key given for the plugin overrides a global api key. If neither is given, none is used, error will be reported when plugin is called.
		trigger.options.cacheTime = trigger.options.cacheTime || 1 * 60 * 60 * 1000;
		trigger.options.onjoin = trigger.options.onjoin || true;
	return trigger;
};

BanCheckTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	if(this.options.onjoin && (this.options.onjoin==true || (this.options.onjoin instanceof Array && this.options.onjoin.indexOf(roomId)!=-1)) && this.options.cacheTime > -1 && cache.get(userId)==null) {
//	if(this.options.cacheTime >=0 && cache.get(userId)==null) {
		cache.put(userId,"sent",this.options.cacheTime);
		return this._respond(roomId,userId, false);
	} else return false;
}

// Return true if a message was sent
BanCheckTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
BanCheckTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

BanCheckTrigger.prototype._respond = function(roomId, userId, command) {
	var that = this; var steamId;
	if (command) {
		steamId = this._stripCommand(command);
		if(steamId==null) return false;
		else if(steamId=="") steamId = userId;
	} else steamId = userId;
	winston.info("Checking " + steamId + " for a bans...");
	var fullurl = 'http://api.steampowered.com/ISteamUser/GetPlayerBans/v1?key='+that.options.apikey+"&steamids="+steamId+'&format=json';
	request.get({method:'GET',encoding:'utf8',uri:fullurl,json:true,followAllRedirects:true}, function(error, response, body) {
		if (error) {
			try { winston.warn("Code " + response.statusCode + " from steam for steamid " + steamId); } catch (err) { winston.warn(err.stack) }
			return;
		}
		try {
			console.log(body);
			var bans = body.players[0];
			var bancount = (bans.CommunityBanned==true ? 1 : 0) + (bans.VACBanned==true ? 1 : 0) + (bans.EconomyBan==true ? 1 : 0);
			var commas = bancount-1;
			if(bancount>0) {
				var message = "WARNING: "+((that.chatBot.steamClient.users && steamId in that.chatBot.steamClient.users) ? (that.chatBot.steamClient.users[steamId].playerName + "/"+steamId) : steamId) + " has the following bans: ";
					if(bans.VACBanned==true) {
						message += bans.NumberOfVACBans + " VAC Bans" + (commas > 0 ? ", " : ".");
						commas--;
					} if(bans.CommunityBanned==true) {
						message += "a Community ban" + (commas > 0 ? ", " : ".");
						commas--;
					} if(bans.EconomyBan==true) {
						message += "an Economy ban.";
					}
				that._sendMessageAfterDelay(roomId, message);
				return true;
			} else if(command) {
				that._sendMessageAfterDelay(roomId, ((that.chatBot.steamClient.users && steamId in that.chatBot.steamClient.users) ? (that.chatBot.steamClient.users[steamId].playerName + "/"+steamId) : steamId) + " has no bans.");
			} else return false;
		} catch(err) {
			console.log(err.stack);
		}
	});
	return true;
}
BanCheckTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}
