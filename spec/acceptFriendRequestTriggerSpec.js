var sinon = require('sinon');

var AcceptFriendRequestTrigger = require('../lib/triggers/acceptFriendRequestTrigger.js');

describe("AcceptFriendRequestTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['addFriend']);
	});

	it("should accept friend requests", function() {
		var trigger = AcceptFriendRequestTrigger.create("acceptFriendRequest", fakeBot);

		expect(trigger.onFriendRequest('userId')).toEqual(true);
		expect(fakeBot.addFriend).toHaveBeenCalledWith('userId');
	});
});
