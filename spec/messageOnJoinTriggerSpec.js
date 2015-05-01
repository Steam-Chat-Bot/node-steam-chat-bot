var sinon = require('sinon');

var MessageOnJoinTrigger = require('../lib/triggers/messageOnJoinTrigger.js');

describe("MessageOnJoinTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should send a message when the specified user joins", function() {
		var trigger = MessageOnJoinTrigger.create("messageOnJoin", fakeBot, { user: 'userId', message: 'enter message' } );

		expect(trigger.onEnteredChat('room1', 'bad user')).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onEnteredChat('room1', 'userId')).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith('room1', 'enter message');
	});
});
