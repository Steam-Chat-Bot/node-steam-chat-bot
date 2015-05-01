var WolframAlphaTrigger = require('../lib/triggers/wolframAlphaTrigger.js');

describe("WolframAlphaTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should only respond to messages that start with the command", function() {
		var fakeWolframClient = jasmine.createSpyObj('fakeWolframClient', ['query']);
		var trigger = WolframAlphaTrigger.create("wolframAlphaTrigger", fakeBot, { command: '!wolfram', client: fakeWolframClient } );

		expect(trigger.onFriendMessage('userId', 'wolfram not the right command', false)).toEqual(false);
		expect(fakeWolframClient.query).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'wolfram not the right command', false, false)).toEqual(false);
		expect(fakeWolframClient.query).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!wolframs also not the right command', false)).toEqual(false);
		expect(fakeWolframClient.query).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', '!wolframs also not the right command', false, false)).toEqual(false);
		expect(fakeWolframClient.query).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!wolfram is the right command', false)).toEqual(true);
		expect(fakeWolframClient.query).toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', '!wolfram is the right command', false, false)).toEqual(true);
		expect(fakeWolframClient.query.calls.length).toEqual(2);

		expect(trigger.onFriendMessage('userId', '!Wolfram case insensitive', false)).toEqual(true);
		expect(fakeWolframClient.query.calls.length).toEqual(3);

		expect(trigger.onChatMessage('roomId', 'userId', '!WOLFRAM case insensitive', false, false)).toEqual(true);
		expect(fakeWolframClient.query.calls.length).toEqual(4);
	});

	it("should not respond to messages that only contain the command", function() {
		var fakeWolframClient = jasmine.createSpyObj('client', ['query']);
		var trigger = WolframAlphaTrigger.create("wolframAlphaTrigger", fakeBot, { command: '!wolfram', client: fakeWolframClient } );

		expect(trigger.onFriendMessage('userId', '!wolfram', false)).toEqual(false);
		expect(fakeWolframClient.query).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!wolfram ', false)).toEqual(false);
		expect(fakeWolframClient.query).not.toHaveBeenCalled();
	});

	it("should strip out the command before querying wolfram", function() {
		var fakeWolframClient = jasmine.createSpyObj('client', ['query']);
		var trigger = WolframAlphaTrigger.create("wolframAlphaTrigger", fakeBot, { command: '!wolfram', client: fakeWolframClient } );

		expect(trigger.onFriendMessage('userId', '!wolfram should be stripped', false)).toEqual(true);
		expect(fakeWolframClient.query).toHaveBeenCalled();
		expect(fakeWolframClient.query.calls[0].args[0]).toEqual("should be stripped");
	});

	describe("_getBestResult", function() {
		it("should return the primary result's value if it exists", function() {
			var trigger = WolframAlphaTrigger.create("wolframAlphaTrigger", fakeBot, { } );

			var result = trigger._getBestResult([
				{ 'subpods': [{ title: '', value: 'interpretation result', image: '' }], "primary": false },
				{ 'subpods': [{ title: '', value: 'non-primary value', image: '' }], "primary": false },
				{ 'subpods': [{ title: '', value: 'primary value', image: '' }], "primary": true },
				{ 'subpods': [{ title: '', value: 'another non-primary value', image: '' }], "primary": false }
			]);

			expect(result).toEqual('primary value');
		});

		it("should return the primary result's image if it exists but has no value", function() {
			var trigger = WolframAlphaTrigger.create("wolframAlphaTrigger", fakeBot, { } );

			var result = trigger._getBestResult([
				{ 'subpods': [{ title: '', value: 'interpretation result', image: '' }], "primary": false },
				{ 'subpods': [{ title: '', value: 'non-primary value', image: '' }], "primary": false },
				{ 'subpods': [{ title: '', value: '', image: 'primary image' }], "primary": true },
				{ 'subpods': [{ title: '', value: 'another non-primary value', image: '' }], "primary": false }
			]);

			expect(result).toEqual('primary image');
		});

		it("should return the first result's value if there is no primary result", function() {
			var trigger = WolframAlphaTrigger.create("wolframAlphaTrigger", fakeBot, { } );

			var result = trigger._getBestResult([
				{ 'subpods': [{ title: '', value: 'interpretation result', image: '' }], "primary": false },
				{ 'subpods': [{ title: '', value: 'non-primary value', image: '' }], "primary": false },
				{ 'subpods': [{ title: '', value: 'another primary value', image: '' }], "primary": false },
				{ 'subpods': [{ title: '', value: 'third non-primary value', image: '' }], "primary": false }
			]);

			expect(result).toEqual('non-primary value');
		});

		it("should return the first result's image if there is no primary result and no first result value", function() {
			var trigger = WolframAlphaTrigger.create("wolframAlphaTrigger", fakeBot, { } );

			var result = trigger._getBestResult([
				{ 'subpods': [{ title: '', value: 'interpretation result', image: '' }], "primary": false },
				{ 'subpods': [{ title: '', value: '', image: 'non-primary image' }], "primary": false },
				{ 'subpods': [{ title: '', value: 'another primary value', image: '' }], "primary": false },
				{ 'subpods': [{ title: '', value: 'third non-primary value', image: '' }], "primary": false }
			]);

			expect(result).toEqual('non-primary image');
		});

		it("should return null if there is no primary result or first result", function() {
			var trigger = WolframAlphaTrigger.create("wolframAlphaTrigger", fakeBot, { } );

			var result = trigger._getBestResult([
				{ 'subpods': [{ title: '', value: 'interpretation result', image: '' }], "primary": false },
			]);

			expect(result).toEqual(null);

			result = trigger._getBestResult([]);

			expect(result).toEqual(null);
		});
	});
});
