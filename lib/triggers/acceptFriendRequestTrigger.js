var util = require("util");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Automatically accepts all friend requests.
*/

var AcceptFriendRequestTrigger = function() {
	AcceptFriendRequestTrigger.super_.apply(this, arguments);
};

util.inherits(AcceptFriendRequestTrigger, BaseTrigger);

var type = "AcceptFriendRequestTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new AcceptFriendRequestTrigger(type, name, chatBot, options);
	trigger.respectsMute = false;
	trigger.respectsFilters = false;
	return trigger;
};

AcceptFriendRequestTrigger.prototype._respondToFriendRequest = function(userId) {
	this.chatBot.addFriend(userId);
	return true;
}
