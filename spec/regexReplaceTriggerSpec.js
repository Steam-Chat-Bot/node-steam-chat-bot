var sinon = require('sinon');

var RegexReplaceTrigger = require('../lib/triggers/regexReplaceTrigger.js');

describe("RegexReplaceTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should respond to matches in friend messages", function() {
		var trigger = RegexReplaceTrigger.create("regexReplace", fakeBot, { match: /^m+a+tes?$/, response: 'mate' } );

		expect(trigger.onFriendMessage('userId', 'amate', false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'matey', false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'a mate', false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'mate', false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'MATE', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);

		expect(trigger.onFriendMessage('userId', 'mates', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(3);

		expect(trigger.onFriendMessage('userId', 'maaaaates', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(4);

		expect(trigger.onFriendMessage('userId', 'mmmmmates', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(5);

		expect(trigger.onFriendMessage('userId', 'mmmmaaaaates', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(6);
	});

	it("should respond to matches in chat messages", function() {
		var trigger = RegexReplaceTrigger.create("regexReplace", fakeBot, { match: /^m+a+tes?$/, response: 'mate' } );

		expect(trigger.onChatMessage('roomId', 'userId', 'amate', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'matey', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'a mate', false, false)).toEqual(false);
		expect(fakeBot.sendMessage).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'mate', false, false)).toEqual(true);
		expect(fakeBot.sendMessage).toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'MATE', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);

		expect(trigger.onChatMessage('roomId', 'userId', 'mates', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(3);

		expect(trigger.onChatMessage('roomId', 'userId', 'maaaaates', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(4);

		expect(trigger.onChatMessage('roomId', 'userId', 'mmmmmates', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(5);

		expect(trigger.onChatMessage('roomId', 'userId', 'mmmmaaaaates', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(6);
	});

	it("should replace matched groups", function() {
		var trigger = RegexReplaceTrigger.create("regexReplace", fakeBot, { match: /^(m+?)(a+?)te(s??)$/, response: '{0}m{1}aaate{2}' } );

		expect(trigger.onChatMessage('roomId', 'userId', 'mate', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(1);
		expect(fakeBot.sendMessage.calls[0].args[1]).toEqual('mmaaaate');

		expect(trigger.onChatMessage('roomId', 'userId', 'MATE', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);
		expect(fakeBot.sendMessage.calls[1].args[1]).toEqual('mmaaaate');

		expect(trigger.onChatMessage('roomId', 'userId', 'mates', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(3);
		expect(fakeBot.sendMessage.calls[2].args[1]).toEqual('mmaaaates');

		expect(trigger.onChatMessage('roomId', 'userId', 'maaaaates', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(4);
		expect(fakeBot.sendMessage.calls[3].args[1]).toEqual('mmaaaaaaaates');

		expect(trigger.onChatMessage('roomId', 'userId', 'mmmmmates', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(5);
		expect(fakeBot.sendMessage.calls[4].args[1]).toEqual('mmmmmmaaaates');

		expect(trigger.onChatMessage('roomId', 'userId', 'mmmmaaaaates', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(6);
		expect(fakeBot.sendMessage.calls[5].args[1]).toEqual('mmmmmaaaaaaaates');

		expect(trigger.onChatMessage('roomId', 'userId', 'mmmmaaaaate', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(7);
		expect(fakeBot.sendMessage.calls[6].args[1]).toEqual('mmmmmaaaaaaaate');
	});

	it("should be able to replace a specific word in the reply", function() {
		var trigger = RegexReplaceTrigger.create("regexReplace", fakeBot, { match: /^(.*?)\bmatch\b(.*?)$/i, response: '{0}replacement{1}' } );

		expect(trigger.onChatMessage('roomId', 'userId', 'match', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(1);
		expect(fakeBot.sendMessage.calls[0].args[1]).toEqual('replacement');

		expect(trigger.onChatMessage('roomId', 'userId', 'a match here', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);
		expect(fakeBot.sendMessage.calls[1].args[1]).toEqual('a replacement here');

		expect(trigger.onChatMessage('roomId', 'userId', 'UPPERCASE MATCH', false, false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(3);
		expect(fakeBot.sendMessage.calls[2].args[1]).toEqual('uppercase replacement');
	});
});
