var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Accepts chat invites for whitelisted servers and says an optional message after joining.
Relevant options are:
chatrooms = {"roomId1": "message1", "roomId1": "message1"} - list of rooms to join and their welcome message. If message is null, it will be replaced with
	defaultMessage; $inviter will be replaced with inviter's steamid64, $inviterurl with their profile url, and $invitername with their name/url.
autoJoinAfterDisconnect = boolean - automatically rejoin chat after the bot reconnects or starts up again (unless it has been removed from chat since it was invited)
joinAll = bool or array - set to 'true' to allow *anyone* to invite the bot to *any* chat. Set to false to only allow people to invite it to specified chats
	Set to an array of users to only allow those users to invite the bot to all chats (anyone can still invite the bot to the chats specified)
defaultMessage = string - used when a room's welcome message is set to null (not falsy, only null) or when joinAll is being used to allow joining
	unspecified chats. replaceable info is same as above.
*/

var AcceptChatInviteTrigger = function() {
	AcceptChatInviteTrigger.super_.apply(this, arguments);
};

util.inherits(AcceptChatInviteTrigger, BaseTrigger);

var type = "AcceptChatInviteTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new AcceptChatInviteTrigger(type, name, chatBot, options);
	trigger.options.chatrooms = trigger.options.chatrooms || {};
	trigger.options.joinAll = options.joinAll || false;
	trigger.options.defaultMessage = (options.hasOwnProperty('defaultMessage') ? options.defaultMessage : "Hello! I was invited by $invitername!");
	trigger.respectsMute = false;
	return trigger;
};

AcceptChatInviteTrigger.prototype._respondToChatInvite = function(roomId, roomName, inviterId) {
	if (roomId in this.options.chatrooms || this.options.joinAll === true ||
		(this.options.joinAll instanceof Array && this.options.joinAll.indexOf(inviterId) > -1)
	) {
		this.chatBot.joinChat(roomId, this.options.autoJoinAfterDisconnect);
		var welcomeMsg = this.options.chatrooms[roomId];
		if(welcomeMsg === false) { welcomeMsg = this.options.defaultMessage; }
		if (welcomeMsg!=null) {
			welcomeMsg = welcomeMsg.split('$inviterurl').join('https://steamcommunity.com/profiles/'+inviterId);
			welcomeMsg = welcomeMsg.split('$invitername').join(this._username(inviterId));
			welcomeMsg = welcomeMsg.split('$inviter').join(inviterId);
			this._sendMessageAfterDelay(roomId, welcomeMsg);
		}
		return true;
	}
	return false;
}
AcceptChatInviteTrigger.prototype._username = function(steamId) {
	if (this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates) {
		return this.chatBot.steamFriends.personaStates[steamId].player_name;
	}
	return steamId;
}
