var util = require('util');
var request = require('request');
var winston = require('winston');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
var TinyCache = require( 'tinycache' );
var cache = new TinyCache();
/*
Trigger that automatically checks users for a private profile on join
cacheTime - Message will not be sent if last join was within this much time, to reduce spam. Defaults to 10 minutes.
apikey - your steam api key. Can be alternatively defined for the bot globally as an option, steamapikey. Not required for this particular plugin.
*/

var ProfileCheckTrigger = function() {
	ProfileCheckTrigger.super_.apply(this, arguments);
};

util.inherits(ProfileCheckTrigger, BaseTrigger);

var type = "ProfileCheckTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new ProfileCheckTrigger(type, name, chatBot, options);
		trigger.respectsMute = false;
		trigger.options.apikey = trigger.options.apikey || (chatBot.options.steamapikey || false); //An api key given for the plugin overrides a global api key. If neither is given, none is used, error will be reported when plugin is called.
		trigger.options.cacheTime = trigger.options.cacheTime || 10 * 60 * 1000;
	return trigger;
};

ProfileCheckTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	if(cache.get(userId)==null) {
		cache.put(userId,"sent",this.options.cacheTime);
		return this._respond(roomId,userId);
	} else return false;
}
ProfileCheckTrigger.prototype._respond = function(roomId,userId) {
	var that = this;
	winston.info("Checking " + userId + " for a closed profile...");
	var fullurl = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?'+(that.options.apikey ? "key="+that.options.apikey+"&" : "" ) + "steamids="+userId+'&format=json';
	request.get({method:'GET',encoding:'utf8',uri:fullurl,json:true,followAllRedirects:true}, function(error, response, body) {
		if (error) {
			try { winston.warn("Code " + response.statusCode + " from steam for steamid " + userId); } catch (err) { winston.warn(err.stack) }
			return;
		}
		try {
			var message = "";
			var userInfo = body.response.players[0];
			if(!userInfo.profilestate || userInfo.profilestate != 1 || userInfo.communityvisibilitystate!=3)
				that._sendMessageAfterDelay(roomId, "WARNING: "+userInfo.personaname+"/"+userInfo.steamid+" has a closed profile or never set it up.");
			else return false;
		} catch(err) {
			console.log(err.stack);
		}
	});
	return true;
}
