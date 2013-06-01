var util = require('util');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Automatically accepts all friend requests.
*/

var AcceptFriendRequestTrigger = function() {
	AcceptFriendRequestTrigger.super_.call(this);
};

util.inherits(AcceptFriendRequestTrigger, BaseTrigger);

AcceptFriendRequestTrigger.prototype._respondToFriendRequest = function(userId) {
	this.chatBot.addFriend(userId);
	return true;
}

var type = "AcceptFriendRequestTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new AcceptFriendRequestTrigger();
	trigger.init(name, chatBot, options);
	trigger.type = type;
	trigger.respectsMute = false;
	return trigger;
};