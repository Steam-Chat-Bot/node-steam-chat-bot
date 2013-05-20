var sinon = require('sinon');

var ButtBotTrigger = require('../lib/triggers/buttBotTrigger.js');

describe("ButtBotTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should replace a random word when triggered in a friend message", function() {
		var trigger = ButtBotTrigger.create("buttBot", fakeBot, { replacement: 'butt' } );

		sinon.stub(Math, 'random').returns(0.5);
		expect(trigger.onFriendMessage('userId', 'word1 word2 word3', false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith('userId', 'word1 butt word3');
		Math.random.restore();
	});

	it("should replace a random word when triggered in a chat message", function() {
		var trigger = ButtBotTrigger.create("buttBot", fakeBot, { replacement: 'butt' } );

		sinon.stub(Math, 'random').returns(0.5);
		expect(trigger.onChatMessage('roomId', 'userId', 'word1 word2 word3', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalledWith('roomId', 'word1 butt word3');
		Math.random.restore();
	});

	it("should not trigger for messages that are too short", function() {
		var trigger = ButtBotTrigger.create("buttBot", fakeBot, { replacement: 'butt' } );

		expect(trigger.onChatMessage('roomId', 'userId', 'word1', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'word1 word2', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalled();
	});

	it("should not trigger for messages that are too long", function() {
		var trigger = ButtBotTrigger.create("buttBot", fakeBot, { replacement: 'butt' } );

		expect(trigger.onChatMessage('roomId', 'userId', '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalled();
	});
});
