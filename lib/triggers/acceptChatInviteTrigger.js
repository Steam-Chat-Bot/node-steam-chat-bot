var util = require('util');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Accepts chat invites for whitelisted servers and says an optional message after joining.
Relevant options are:
chatrooms = {"roomId1": "message1", "roomId1": "message1"} - list of rooms to join and their welcome message (can be null)
autoJoinAfterDisconnect = boolean - automatically rejoin chat after the bot reconnects or starts up again (unless it has been removed from chat since it was invited)
*/

var AcceptChatInviteTrigger = function() {
	AcceptChatInviteTrigger.super_.apply(this, arguments);
};

util.inherits(AcceptChatInviteTrigger, BaseTrigger);

var type = "AcceptChatInviteTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new AcceptChatInviteTrigger(type, name, chatBot, options);
	trigger.respectsMute = false;
	return trigger;
};

AcceptChatInviteTrigger.prototype._respondToChatInvite = function(roomId, roomName, inviterId) {
	console.log(type);
	if (roomId in this.options.chatrooms) {
		this.chatBot.joinChat(roomId, this.options.autoJoinAfterDisconnect);
		var welcomeMsg = this.options.chatrooms[roomId];
		if (welcomeMsg) {
			this._sendMessageAfterDelay(roomId, welcomeMsg);
		}
		return true;
	}
	return false;
}
