var sinon = require('sinon');

var BotCommandTrigger = require('../lib/triggers/botCommandTrigger.js');

describe("BotCommandTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['mute', 'unmute']);
	});

	it("should call the callback on exact match friend message", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute'], exact: true, callback: function(bot) { bot.mute(); } } );

		expect(trigger.onFriendMessage('userId', 'mute', false)).toEqual(false);
		expect(fakeBot.mute).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'do !mute', false)).toEqual(false);
		expect(fakeBot.mute).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!mute', false)).toEqual(true);
		expect(fakeBot.mute).toHaveBeenCalled();
	});

	it("should call callback on exact match chat message", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute'], exact: true, callback: function(bot) { bot.mute(); } } );

		expect(trigger.onChatMessage('roomId', 'userId', '!mute', false, false)).toEqual(true);
		expect(fakeBot.mute).toHaveBeenCalled();
	});

	it("should call callback on inexact match if exact is false", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute'], exact: false, callback: function(bot) { bot.mute(); } } );

		expect(trigger.onChatMessage('roomId', 'userId', 'do !mute', false, false)).toEqual(true);
		expect(fakeBot.mute).toHaveBeenCalled();
	});

	it("should call a callback on any of the matches", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute', '!pause'], exact: true, callback: function(bot) { bot.mute(); } } );

		expect(trigger.onFriendMessage('userId', '!mute', false)).toEqual(true);
		expect(fakeBot.mute).toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!pause', false)).toEqual(true);
		expect(fakeBot.mute.calls.length).toEqual(2);
	});

	it("should call a callback even when muted", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute'], exact: true, callback: function(bot) { bot.mute(); } } );

		expect(trigger.onChatMessage('roomId', 'userId', '!mute', false, true)).toEqual(true);
		expect(fakeBot.mute).toHaveBeenCalled();
	});

	it("should call a callback even if a chat message has already triggered", function() {
		var trigger = BotCommandTrigger.create("botCommand", fakeBot, { matches: ['!mute'], exact: true, callback: function(bot) { bot.mute(); } } );

		expect(trigger.onChatMessage('roomId', 'userId', '!mute', true, false)).toEqual(true);
		expect(fakeBot.mute).toHaveBeenCalled();
	});
});
