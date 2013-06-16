var sinon = require('sinon');

var AcceptChatInviteTrigger = require('../lib/triggers/acceptChatInviteTrigger.js');

describe("AcceptChatInviteTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage', 'joinChat']);
	});

	it("should only join whitelisted chat rooms", function() {
		var trigger = AcceptChatInviteTrigger.create("acceptChatInvite", fakeBot, { chatrooms: { 'room1': null, 'room2': null }, autoJoinAfterDisconnect: true } );

		expect(trigger.onChatInvite('room1', 'room name', 'inviterId')).toEqual(true);
		expect(fakeBot.joinChat).toHaveBeenCalledWith('room1', true);

		expect(trigger.onChatInvite('room2', 'room name', 'inviterId')).toEqual(true);
		expect(fakeBot.joinChat).toHaveBeenCalledWith('room2', true);

		expect(trigger.onChatInvite('room3', 'room name', 'inviterId')).toEqual(false);
		expect(fakeBot.joinChat.calls.length).toEqual(2);
	});

	it("should send a welcome message after a delay", function() {
		runs(function() {
			var trigger = AcceptChatInviteTrigger.create("acceptChatInvite", fakeBot, { chatrooms: { 'room1': 'hi guys' }, delay: 100 } );
			expect(trigger.onChatInvite('room1', 'room name', 'inviterId')).toEqual(true);

			setTimeout(function() { expect(fakeBot.sendMessage).not.toHaveBeenCalled(); }, 50);
		});

		waits(110);

		runs(function() {
			expect(fakeBot.sendMessage).toHaveBeenCalledWith('room1', 'hi guys');
		});
	});
});
