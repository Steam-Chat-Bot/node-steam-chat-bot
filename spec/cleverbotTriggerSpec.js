var sinon = require('sinon');

var CleverbotTrigger = require('../lib/triggers/cleverbotTrigger.js');

describe("CleverbotTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should only respond to friend messages when a keyword is mentioned", function() {
		var fakeCleverbot = jasmine.createSpyObj('cleverbot', ['write']);
		var trigger = CleverbotTrigger.create("cleverbotTrigger", fakeBot, { keywords: ['cleverbot'], cleverbot: fakeCleverbot } );

		expect(trigger.onFriendMessage('userId', 'keyword not mentioned', false)).toEqual(false);
		expect(fakeCleverbot.write).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'whole keyword not mentioned acleverbot', false)).toEqual(false);
		expect(fakeCleverbot.write).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'cleverbot mentioned', false)).toEqual(true);
		expect(fakeCleverbot.write).toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'mentioned cleverbot', false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(2);

		expect(trigger.onFriendMessage('userId', 'mentioned cleverbot again', false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(3);
	});

	it("should only respond to chat messages when a keyword is mentioned", function() {
		var fakeCleverbot = jasmine.createSpyObj('cleverbot', ['write']);
		var trigger = CleverbotTrigger.create("cleverbotTrigger", fakeBot, { keywords: ['cleverbot'], cleverbot: fakeCleverbot } );

		expect(trigger.onChatMessage('roomId', 'userId', 'keyword not mentioned', false, false)).toEqual(false);
		expect(fakeCleverbot.write).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'whole keyword not mentioned acleverbot', false, false)).toEqual(false);
		expect(fakeCleverbot.write).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'cleverbot mentioned', false, false)).toEqual(true);
		expect(fakeCleverbot.write).toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'mentioned cleverbot', false, false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(2);

		expect(trigger.onChatMessage('roomId', 'userId', 'mentioned cleverbot again', false, false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(3);
	});

	it("should not respond to messages only containing the keyword", function() {
		var fakeCleverbot = jasmine.createSpyObj('cleverbot', ['write']);
		var trigger = CleverbotTrigger.create("cleverbotTrigger", fakeBot, { keywords: ['cleverbot'], cleverbot: fakeCleverbot } );

		expect(trigger.onFriendMessage('userId', 'cleverbot', false)).toEqual(false);
		expect(fakeCleverbot.write).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', ' cleverbot', false)).toEqual(false);
		expect(fakeCleverbot.write).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'cleverbot ', false)).toEqual(false);
		expect(fakeCleverbot.write).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', ' cleverbot ', false)).toEqual(false);
		expect(fakeCleverbot.write).not.toHaveBeenCalled();
	});

	it("should respond to any keyword", function() {
		var fakeCleverbot = jasmine.createSpyObj('cleverbot', ['write']);
		var trigger = CleverbotTrigger.create("cleverbotTrigger", fakeBot, { keywords: ['cleverbot', 'siri'], cleverbot: fakeCleverbot } );

		expect(trigger.onFriendMessage('userId', 'keyword not mentioned', false)).toEqual(false);
		expect(fakeCleverbot.write).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '1st keyword cleverbot mentioned', false)).toEqual(true);
		expect(fakeCleverbot.write).toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '2nd keyword siri mentioned', false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(2);
	});

	it("should respond to all messages when no keyword option is passed", function() {
		var fakeCleverbot = jasmine.createSpyObj('cleverbot', ['write']);
		var trigger = CleverbotTrigger.create("cleverbotTrigger", fakeBot, { cleverbot: fakeCleverbot } );

		expect(trigger.onFriendMessage('userId', 'hello', false)).toEqual(true);
		expect(fakeCleverbot.write).toHaveBeenCalled();
	});

	it("should strip out the keyword", function() {
		var fakeCleverbot = jasmine.createSpyObj('cleverbot', ['write']);
		var trigger = CleverbotTrigger.create("cleverbotTrigger", fakeBot, { keywords: ['cleverbot'], cleverbot: fakeCleverbot } );

		expect(trigger.onFriendMessage('userId', 'cleverbot should be stripped', false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(1);
		expect(fakeCleverbot.write.calls[0].args[0]).toEqual(" should be stripped");

		expect(trigger.onFriendMessage('userId', 'stripped, should be cleverbot', false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(2);
		expect(fakeCleverbot.write.calls[1].args[0]).toEqual("stripped, should be ");

		expect(trigger.onFriendMessage('userId', 'strip cleverbot ok', false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(3);
		expect(fakeCleverbot.write.calls[2].args[0]).toEqual("strip  ok");
	});

	it("should strip out the keyword", function() {
		var fakeCleverbot = jasmine.createSpyObj('cleverbot', ['write']);
		var trigger = CleverbotTrigger.create("cleverbotTrigger", fakeBot, { keywords: ['cleverbot'], cleverbot: fakeCleverbot } );

		expect(trigger.onFriendMessage('userId', 'cleverbot should be stripped', false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(1);
		expect(fakeCleverbot.write.calls[0].args[0]).toEqual(" should be stripped");

		expect(trigger.onFriendMessage('userId', 'stripped, should be cleverbot', false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(2);
		expect(fakeCleverbot.write.calls[1].args[0]).toEqual("stripped, should be ");

		expect(trigger.onFriendMessage('userId', 'strip cleverbot ok', false)).toEqual(true);
		expect(fakeCleverbot.write.calls.length).toEqual(3);
		expect(fakeCleverbot.write.calls[2].args[0]).toEqual("strip  ok");
	});

	it("multiple not respond if another trigger has already fired", function() {
		var fakeCleverbot = jasmine.createSpyObj('cleverbot', ['write']);
		var trigger = CleverbotTrigger.create("cleverbotTrigger", fakeBot, { keywords: ['cleverbot'], cleverbot: fakeCleverbot } );

		expect(trigger.onFriendMessage('userId', 'hi cleverbot', true)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();
	});
});
