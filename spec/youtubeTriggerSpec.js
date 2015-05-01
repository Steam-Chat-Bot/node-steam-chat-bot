var sinon = require('sinon');

var YoutubeTrigger = require('../lib/triggers/youtubeTrigger.js');

describe("YoutubeTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should only respond to messages that start with the command", function() {
		var fakeYoutubeClient = { feeds: jasmine.createSpyObj('fakeYoutubeClient', ['videos']) };
		var trigger = YoutubeTrigger.create("YoutubeTrigger", fakeBot, { command: '!yt', youtube: fakeYoutubeClient } );

		expect(trigger.onFriendMessage('userId', 'yt not the right command', false)).toEqual(false);
		expect(fakeYoutubeClient.feeds.videos).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'yt not the right command', false, false)).toEqual(false);
		expect(fakeYoutubeClient.feeds.videos).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!yts also not the right command', false)).toEqual(false);
		expect(fakeYoutubeClient.feeds.videos).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', '!yts also not the right command', false, false)).toEqual(false);
		expect(fakeYoutubeClient.feeds.videos).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!yt is the right command', false)).toEqual(true);
		expect(fakeYoutubeClient.feeds.videos).toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', '!yt is the right command', false, false)).toEqual(true);
		expect(fakeYoutubeClient.feeds.videos.calls.length).toEqual(2);

		expect(trigger.onFriendMessage('userId', '!YT case insensitive', false)).toEqual(true);
		expect(fakeYoutubeClient.feeds.videos.calls.length).toEqual(3);

		expect(trigger.onChatMessage('roomId', 'userId', '!Yt case insensitive', false, false)).toEqual(true);
		expect(fakeYoutubeClient.feeds.videos.calls.length).toEqual(4);
	});

	it("should not respond to messages that only contain the command", function() {
		var fakeYoutubeClient = { feeds: jasmine.createSpyObj('fakeYoutubeClient', ['videos']) };
		var trigger = YoutubeTrigger.create("YoutubeTrigger", fakeBot, { command: '!yt', youtube: fakeYoutubeClient } );

		expect(trigger.onFriendMessage('userId', '!yt', false)).toEqual(false);
		expect(fakeYoutubeClient.feeds.videos).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!yt ', false)).toEqual(false);
		expect(fakeYoutubeClient.feeds.videos).not.toHaveBeenCalled();
	});

	it("should strip out the command before querying youtube", function() {
		var fakeYoutubeClient = { feeds: jasmine.createSpyObj('fakeYoutubeClient', ['videos']) };
		var trigger = YoutubeTrigger.create("YoutubeTrigger", fakeBot, { command: '!yt', youtube: fakeYoutubeClient } );

		expect(trigger.onFriendMessage('userId', '!yt should be stripped', false)).toEqual(true);
		expect(fakeYoutubeClient.feeds.videos).toHaveBeenCalled();
		expect(fakeYoutubeClient.feeds.videos.calls[0].args[0].q).toEqual("should be stripped");
	});

	it("should not randomly rickroll if the option is not set", function() {
		var fakeYoutubeClient = { feeds: { videos: null } };
		spyOn(fakeYoutubeClient.feeds, 'videos').andCallFake(function() {
			arguments[1](null, { items: [{ id: 'xxx' }] });
		});

		var trigger1 = YoutubeTrigger.create("YoutubeTrigger1", fakeBot, { command: '!yt', youtube: fakeYoutubeClient, rickrollChance: 0 } );
		var trigger2 = YoutubeTrigger.create("YoutubeTrigger2", fakeBot, { command: '!yt', youtube: fakeYoutubeClient } );

		sinon.stub(Math, 'random').returns(0.999999);

		expect(trigger1.onFriendMessage('userId', '!yt query', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(1);
		expect(fakeBot.sendMessage.calls[0].args[1]).not.toEqual(YoutubeTrigger.RickrollUrl);

		expect(trigger2.onFriendMessage('userId', '!yt query', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);
		expect(fakeBot.sendMessage.calls[1].args[1]).not.toEqual(YoutubeTrigger.RickrollUrl);

		Math.random.restore();
	});

	it("should randomly rickroll if the option is set", function() {
		var fakeYoutubeClient = { feeds: { videos: null } };
		spyOn(fakeYoutubeClient.feeds, 'videos').andCallFake(function() {
			arguments[1](null, { items: [{ id: 'xxx' }] });
		});

		var trigger = YoutubeTrigger.create("YoutubeTrigger1", fakeBot, { command: '!yt', youtube: fakeYoutubeClient, rickrollChance: 0.20 } );

		sinon.stub(Math, 'random').returns(0.19);

		expect(trigger.onFriendMessage('userId', '!yt query', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(1);
		expect(fakeBot.sendMessage.calls[0].args[1]).toEqual(YoutubeTrigger.RickrollUrl);

		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.21);

		expect(trigger.onFriendMessage('userId', '!yt query', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(2);
		expect(fakeBot.sendMessage.calls[1].args[1]).toEqual('http://www.youtube.com/watch?v=xxx');

		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.50);

		expect(trigger.onFriendMessage('userId', '!yt query', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(3);
		expect(fakeBot.sendMessage.calls[2].args[1]).toEqual('http://www.youtube.com/watch?v=xxx');

		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.75);

		expect(trigger.onFriendMessage('userId', '!yt query', false)).toEqual(true);
		expect(fakeBot.sendMessage.calls.length).toEqual(4);
		expect(fakeBot.sendMessage.calls[3].args[1]).toEqual('http://www.youtube.com/watch?v=xxx');

		Math.random.restore();

	});
});
