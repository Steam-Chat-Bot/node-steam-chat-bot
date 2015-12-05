var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var TinyCache = require( "tinycache" );
var cache = new TinyCache();
/*
Trigger that automatically checks users for a steam bans (cab, community, economy) on join, and on command
command - defaults to !bans. Set probability of 0 to disable.
cacheTime - Message will not be sent if last join was within this much time, to reduce spam.
	Defaults to 1 hour. Set to -1 to disable onjoin checking.
apikey - your steam api key. Can be alternatively defined for the bot globally as an option, steamapikey. Required.
onjoin - does it announce when someone joins a room with a ban? Set to true, false, or an array of chats to announce in.
respectsMute - does it respect muted status? Defaults to no.
*/

var BanCheckTrigger = function() {
	BanCheckTrigger.super_.apply(this, arguments);
};

util.inherits(BanCheckTrigger, BaseTrigger);

var type = "BanCheckTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new BanCheckTrigger(type, name, chatBot, options);
		trigger.respectsMute = trigger.options.respectsMute || false;
		trigger.options.command = trigger.options.command || "!bans";
		trigger.options.apikey = trigger.options.apikey || (chatBot.apikey || undefined);
		trigger.options.cacheTime = trigger.options.cacheTime || 1 * 60 * 60 * 1000;
		trigger.options.onjoin = trigger.options.onjoin ? trigger.options.onjoin : (trigger.options.onjoin === false ? false : true);
		trigger.allowMessageTriggerAfterResponse = true;
	return trigger;
};

BanCheckTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	if( this.options.onjoin && this.options.cacheTime > -1 && cache.get(userId)===null) {
		if(this.options.onjoin===true || (this.options.onjoin instanceof Array && this.options.onjoin.indexOf(roomId)!==-1)) {
			cache.put(userId,"sent",this.options.cacheTime);
			return this._respond(roomId,userId, false);
		}
	}
	return false;
}

// Return true if a message was sent
BanCheckTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
BanCheckTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

BanCheckTrigger.prototype._displayName = function(steamId) {
	if(this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates) {
		return this.chatBot.steamFriends.personaStates[steamId].player_name + "/"+steamId;
	} else {
		return steamId;
	}
}

BanCheckTrigger.prototype._respond = function(roomId, userId, command) {
	var that = this;
	var steamId;
	if (command) {
		steamId = this._stripCommand(command);
		if(steamId===null) {
			return false;
		} else if(steamId==="") {
			steamId = userId;
		}
	} else {
		steamId = userId;
	}
	this.winston.info(this.chatBot.name+"/"+this.name+": Checking " + steamId + " for a bans...");
		var body;
    this.chatBot.steamApi('ISteamUser', 'GetPlayerBans', 1, 'get', this.options.apikey, {
			steamids: steamId,
			format: 'json'
		}).then(function(value) {
			body = value;
			try {
				var bans = body.players[0];
				var bancount = (bans.CommunityBanned===true ? 1 : 0) + (bans.VACBanned===true ? 1 : 0) + (bans.EconomyBan===true ? 1 : 0);
				var commas = bancount-1;
				if(bancount>0) {
					var message = "WARNING: "+that._displayName(steamId) + " has the following bans: ";
						if(bans.VACBanned===true) {
							message += bans.NumberOfVACBans + " VAC Bans" + (commas > 0 ? ", " : ".");
							commas--;
						} if(bans.CommunityBanned===true) {
							message += "a Community ban" + (commas > 0 ? ", " : ".");
							commas--;
						} if(bans.EconomyBan===true) {
							message += "an Economy ban.";
						}
					that._sendMessageAfterDelay(roomId, message);
					return true;
				} else if(command && bancount < 1) {
					that._sendMessageAfterDelay(roomId, that._displayName(steamId) + " has no bans.");
				} else {
					return false;
				}
			} catch(err) {
				that.winston.error(this.chatBot.name+"/"+this.name+": ERROR",err.stack);
			}
		}).catch(function(value) {
			that.winston.error(this.chatBot.name+"/"+this.name+": ERROR",value);
		});
	return true;
}
BanCheckTrigger.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}
