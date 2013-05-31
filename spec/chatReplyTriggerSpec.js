var sinon = require('sinon');

var ChatReplyTrigger = require('../lib/triggers/chatReplyTrigger.js');

describe("ChatReplyTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should only respond to exact matches when the exact option is set in a friend message", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger'], responses: ['response'], exact: true } );

		expect(trigger.onFriendMessage('userId', 'atrigger', false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'triggera', false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'the trigger is', false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'trigger', false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("userId", "response");
	});

	it("should only respond to exact matches when the exact option is set in a chat message", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger'], responses: ['response'], exact: true } );

		expect(trigger.onChatMessage('roomId', 'userId', 'atrigger', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'triggera', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'the trigger is', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'trigger', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("roomId", "response");
	});

	it("should respond to inexact matches when the exact option is not set in a chat message", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger'], responses: ['response'], exact: false } );

		expect(trigger.onFriendMessage('userId', 'trigge', false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'triggeb', false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'rrigger', false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'trigger', false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("userId", "response");

		expect(trigger.onFriendMessage('userId', 'triggers', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);

		expect(trigger.onFriendMessage('userId', 'atrigger', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(3);

		expect(trigger.onFriendMessage('userId', 'the trigger is', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(4);
	});

	it("should respond to inexact matches when the exact option is not set in a chat message", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger'], responses: ['response'], exact: false } );

		expect(trigger.onChatMessage('roomId', 'userId', 'trigge', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'triggeb', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'rrigger', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'trigger', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("roomId", "response");

		expect(trigger.onChatMessage('roomId', 'userId', 'triggers', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);

		expect(trigger.onChatMessage('roomId', 'userId', 'atrigger', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(3);

		expect(trigger.onChatMessage('roomId', 'userId', 'the trigger is', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(4);
	});

	it("multiple triggers should not fire on the same message", function() {
		var trigger1 = ChatReplyTrigger.create("chatReply1", fakeBot, { matches: ['trigger'], responses: ['response'], exact: true } );
		var trigger2 = ChatReplyTrigger.create("chatReply2", fakeBot, { matches: ['trigger'], responses: ['response'], exact: true } );

		expect(trigger1.onFriendMessage('userId', 'trigger', false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalled();

		expect(trigger2.onFriendMessage('userId', 'trigger', true)).toEqual(false);
		expect(fakeBot.sendMessage.calls.length).toEqual(1);
	});

	it("should respect mute in chat rooms", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger'], responses: ['response'], exact: false } );

		expect(trigger.onChatMessage('roomId', 'userId', 'trigger', false, true)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalledWith();

		expect(trigger.onChatMessage('roomId', 'userId', 'trigger', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("roomId", "response");
	});

	it("should match any of the set of inputs in a friend message", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger1', 'trigger2'], responses: ['response'], exact: true } );

		expect(trigger.onFriendMessage('userId', 'trigger1', false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("userId", "response");

		expect(trigger.onFriendMessage('userId', 'trigger2', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);

		expect(trigger.onFriendMessage('userId', 'trigger3', false)).toEqual(false);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);
	});

	it("should match any of the set of inputs in a chat message", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger1', 'trigger2'], responses: ['response'], exact: true } );

		expect(trigger.onChatMessage('roomId', 'userId', 'trigger1', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("roomId", "response");

		expect(trigger.onChatMessage('roomId', 'userId', 'trigger2', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);

		expect(trigger.onChatMessage('roomId', 'userId', 'trigger3', false, false)).toEqual(false);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);
	});

	it("should pick a random output in a friend message", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger'], responses: ['response1', 'response2'], exact: true } );

		sinon.stub(Math, 'random').returns(0);
		expect(trigger.onFriendMessage('userId', 'trigger', false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("userId", "response1");
		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.49);
		expect(trigger.onFriendMessage('userId', 'trigger', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);
		expect(fakeBot.sendMessage.calls[1].args[1]).toEqual("response1");
		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.51);
		expect(trigger.onFriendMessage('userId', 'trigger', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(3);
		expect(fakeBot.sendMessage.calls[2].args[1]).toEqual("response2");
		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.9999);
		expect(trigger.onFriendMessage('userId', 'trigger', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(4);
		expect(fakeBot.sendMessage.calls[3].args[1]).toEqual("response2");
		Math.random.restore();
	});

	it("should pick a random output in a friend message", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger'], responses: ['response1', 'response2'], exact: true } );

		sinon.stub(Math, 'random').returns(0.25);
		expect(trigger.onChatMessage('roomId', 'userId', 'trigger', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("roomId", "response1");
		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.75);
		expect(trigger.onChatMessage('roomId', 'userId', 'trigger', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);
		expect(fakeBot.sendMessage.calls[1].args[1]).toEqual("response2");
		Math.random.restore();
	});

	it("should only reply to specific users if specified", function() {
		var trigger = ChatReplyTrigger.create("chatReply", fakeBot, { matches: ['trigger'], responses: ['response'], users: ['user1', 'user2'] } );

		expect(trigger.onChatMessage('roomId', 'user3', 'trigger', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'user1', 'trigger', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith("roomId", "response");

		expect(trigger.onChatMessage('roomId', 'user2', 'trigger', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);
	});
});
