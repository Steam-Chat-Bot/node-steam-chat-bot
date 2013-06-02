var TumblrTrigger = require('../lib/triggers/tumblrTrigger.js');

describe("TumblrTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should not post on demand if there is nothing after a command", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['text', 'photo']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!posttext', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', '!posttext ', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto ', false, false)).toEqual(false);

		expect(fakeTumblrClient.text).not.toHaveBeenCalled();
		expect(fakeTumblrClient.photo).not.toHaveBeenCalled();
	});

	it("should not post on demand without the right command", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['text']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'posttext', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'posttext text here', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', ' !posttext text here', false, false)).toEqual(false);

		expect(fakeTumblrClient.text).not.toHaveBeenCalled();
		expect(fakeTumblrClient.text).not.toHaveBeenCalled();
	});

	it("should not post on demand from a friend message", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['text']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onFriendMessage('userId', '!posttext text here', false)).toEqual(false);
		expect(fakeTumblrClient.text).not.toHaveBeenCalled();
	});

	it("should post text on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['text']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!posttext text here', false, false)).toEqual(true);
		expect(fakeTumblrClient.text.calls.length).toEqual(1);
		expect(fakeTumblrClient.text.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.text.calls[0].args[1]).toEqual({ body: 'text here', tags: 'text' });
	});

	it("should post a link as a photo on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['photo']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.jpg', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(1);
		expect(fakeTumblrClient.photo.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[0].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.jpg' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto       http://a.com/image.jpg   ', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(2);
		expect(fakeTumblrClient.photo.calls[1].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[1].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.jpg' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(3);
		expect(fakeTumblrClient.photo.calls[2].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[2].args[1]).toEqual({ tags: 'photo', source: 'http://a.com' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.bitmap', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(4);
		expect(fakeTumblrClient.photo.calls[3].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[3].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.bitmap' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.jpg?test=param#anchor', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(5);
		expect(fakeTumblrClient.photo.calls[4].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[4].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.jpg?test=param#anchor' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.JPG', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(6);
		expect(fakeTumblrClient.photo.calls[5].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[5].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.JPG' });
	});

	it("should post a photo on demand with additional context if provided", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['photo']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto check this out http://a.com/image.jpg', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(1);
		expect(fakeTumblrClient.photo.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[0].args[1]).toEqual({ tags: 'photo', caption: 'check this out http://a.com/image.jpg', source: 'http://a.com/image.jpg' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.jpg check this out', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(2);
		expect(fakeTumblrClient.photo.calls[1].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[1].args[1]).toEqual({ tags: 'photo', caption: 'http://a.com/image.jpg check this out', source: 'http://a.com/image.jpg' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto check this http://a.com/image.jpg out', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(3);
		expect(fakeTumblrClient.photo.calls[2].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[2].args[1]).toEqual({ tags: 'photo', caption: 'check this http://a.com/image.jpg out', source: 'http://a.com/image.jpg' });
	});

	it("should not post a photo on demand if no links are provided", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['photo']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto no links here http://', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo).not.toHaveBeenCalled();
	});

	it("should post a quote on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['quote']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		var quote = 'this is a quote';

		expect(trigger.onChatMessage('roomId', 'userId', '!postquote ' + quote, false, false)).toEqual(true);
		expect(fakeTumblrClient.quote.calls.length).toEqual(1);
		expect(fakeTumblrClient.quote.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.quote.calls[0].args[1]).toEqual({ quote: quote, tags: 'quote' });
	});

	it("should post a link on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!postlink http://a.com', false, false)).toEqual(true);
		expect(fakeTumblrClient.link.calls.length).toEqual(1);
		expect(fakeTumblrClient.link.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[0].args[1]).toEqual({ tags: 'link', url: 'http://a.com' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postlink http://a.com/link?test=param#anchor', false, false)).toEqual(true);
		expect(fakeTumblrClient.link.calls.length).toEqual(2);
		expect(fakeTumblrClient.link.calls[1].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[1].args[1]).toEqual({ tags: 'link', url: 'http://a.com/link?test=param#anchor' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postlink http://a.com/link x', false, false)).toEqual(true);
		expect(fakeTumblrClient.link.calls.length).toEqual(3);
		expect(fakeTumblrClient.link.calls[2].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[2].args[1]).toEqual({ tags: 'link', description: 'http://a.com/link x', url: 'http://a.com/link' });
	});

	it("should post a chat on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['chat']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		var conversation = '9:30 PM - User 1: first message\
9:30 PM - User 2: second message';

		expect(trigger.onChatMessage('roomId', 'userId', '!postchat ' + conversation, false, false)).toEqual(true);
		expect(fakeTumblrClient.chat.calls.length).toEqual(1);
		expect(fakeTumblrClient.chat.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.chat.calls[0].args[1]).toEqual({ conversation: conversation, tags: 'chat' });
	});

	it("should post audio on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!postaudio https://soundcloud.com/dumbshitthatjakazidmade/get-clucky', false, false)).toEqual(true);
		expect(fakeTumblrClient.audio.calls.length).toEqual(1);
		expect(fakeTumblrClient.audio.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.audio.calls[0].args[1]).toEqual({ tags: 'audio', external_url: 'https://soundcloud.com/dumbshitthatjakazidmade/get-clucky' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postaudio https://soundcloud.com/dumbshitthatjakazidmade/get-clucky?test=param#anchor', false, false)).toEqual(true);
		expect(fakeTumblrClient.audio.calls.length).toEqual(2);
		expect(fakeTumblrClient.audio.calls[1].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.audio.calls[1].args[1]).toEqual({ tags: 'audio', external_url: 'https://soundcloud.com/dumbshitthatjakazidmade/get-clucky?test=param#anchor' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postaudio https://soundcloud.com cluck', false, false)).toEqual(true);
		expect(fakeTumblrClient.audio.calls.length).toEqual(3);
		expect(fakeTumblrClient.audio.calls[2].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.audio.calls[2].args[1]).toEqual({ tags: 'audio', caption: 'https://soundcloud.com cluck', external_url: 'https://soundcloud.com' });
	});

	it("should post video on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['video']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!postvideo http://www.youtube.com/watch?v=7E0ot9iJm_k', false, false)).toEqual(true);
		expect(fakeTumblrClient.video.calls.length).toEqual(1);
		expect(fakeTumblrClient.video.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.video.calls[0].args[1]).toEqual({ tags: 'video', embed: 'http://www.youtube.com/watch?v=7E0ot9iJm_k' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postvideo http://www.youtube.com/watch?v=7E0ot9iJm_k?test=param#anchor', false, false)).toEqual(true);
		expect(fakeTumblrClient.video.calls.length).toEqual(2);
		expect(fakeTumblrClient.video.calls[1].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.video.calls[1].args[1]).toEqual({ tags: 'video', embed: 'http://www.youtube.com/watch?v=7E0ot9iJm_k?test=param#anchor' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postvideo http://www.youtube.com pak', false, false)).toEqual(true);
		expect(fakeTumblrClient.video.calls.length).toEqual(3);
		expect(fakeTumblrClient.video.calls[2].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.video.calls[2].args[1]).toEqual({ tags: 'video', caption: 'http://www.youtube.com pak', embed: 'http://www.youtube.com' });
	});
});
