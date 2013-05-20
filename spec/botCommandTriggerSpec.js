var sinon = require('sinon');

var BotCommandTrigger = require('../lib/triggers/botCommandTrigger.js');

describe("BotCommandTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['mute', 'unmute']);
	});

	it("should call mute on exact match friend message when mute command is selected", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute'], command: BotCommandTrigger.Commands.Mute } );

		expect(trigger.onFriendMessage('userId', 'mute', false)).toEqual(false);
		expect(fakeBot.mute).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'do !mute', false)).toEqual(false);
		expect(fakeBot.mute).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!mute', false)).toEqual(false);
		expect(fakeBot.mute).toHaveBeenCalled();
	});

	it("should call mute on exact match chat message when mute command is selected", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute'], command: BotCommandTrigger.Commands.Mute } );

		expect(trigger.onChatMessage('roomId', 'userId', '!mute', false, false)).toEqual(false);
		expect(fakeBot.mute).toHaveBeenCalled();
	});

	it("should call unmute on exact match when unmute command is selected", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!unmute'], command: BotCommandTrigger.Commands.Unmute } );

		expect(trigger.onFriendMessage('userId', '!unmute', false)).toEqual(false);
		expect(fakeBot.unmute).toHaveBeenCalled();
	});

	it("should call a command on any of the matches", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute', '!pause'], command: BotCommandTrigger.Commands.Mute } );

		expect(trigger.onFriendMessage('userId', '!mute', false)).toEqual(false);
		expect(fakeBot.mute).toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!pause', false)).toEqual(false);
		expect(fakeBot.mute.calls.length).toEqual(2);
	});

	it("should call a command even when muted", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute'], command: BotCommandTrigger.Commands.Mute } );

		expect(trigger.onChatMessage('roomId', 'userId', '!mute', false, true)).toEqual(false);
		expect(fakeBot.mute).toHaveBeenCalled();
	});

	it("should call a command even if a chat message has already triggered", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute'], command: BotCommandTrigger.Commands.Mute } );

		expect(trigger.onChatMessage('roomId', 'userId', '!mute', true, false)).toEqual(false);
		expect(fakeBot.mute).toHaveBeenCalled();
	});
});
