var TumblrTrigger = require('../lib/triggers/tumblrTrigger.js');

describe("TumblrTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should not post on demand if there is nothing after a command", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['text', 'photo']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!posttext', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', '!posttext ', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto ', false, false)).toEqual(false);

		expect(fakeTumblrClient.text).not.toHaveBeenCalled();
		expect(fakeTumblrClient.photo).not.toHaveBeenCalled();
	});

	it("should not post on demand without the right command", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['text']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'posttext', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'posttext text here', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', ' !posttext text here', false, false)).toEqual(false);

		expect(fakeTumblrClient.text).not.toHaveBeenCalled();
		expect(fakeTumblrClient.text).not.toHaveBeenCalled();
	});

	it("should not post on demand from a friend message", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['text']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onFriendMessage('userId', '!posttext text here', false)).toEqual(false);
		expect(fakeTumblrClient.text).not.toHaveBeenCalled();
	});

	it("should post text on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['text']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!posttext text here', false, false)).toEqual(true);
		expect(fakeTumblrClient.text.calls.length).toEqual(1);
		expect(fakeTumblrClient.text.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.text.calls[0].args[1]).toEqual({ body: 'text here', tags: 'text' });
	});

	it("should post a link as a photo on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['photo']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.jpg', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(1);
		expect(fakeTumblrClient.photo.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[0].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.jpg', link: 'http://a.com/image.jpg' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto       http://a.com/image.jpg   ', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(2);
		expect(fakeTumblrClient.photo.calls[1].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[1].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.jpg', link: 'http://a.com/image.jpg' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(3);
		expect(fakeTumblrClient.photo.calls[2].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[2].args[1]).toEqual({ tags: 'photo', source: 'http://a.com', link: 'http://a.com' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.bitmap', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(4);
		expect(fakeTumblrClient.photo.calls[3].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[3].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.bitmap', link: 'http://a.com/image.bitmap' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.jpg?test=param#anchor', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(5);
		expect(fakeTumblrClient.photo.calls[4].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[4].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.jpg?test=param#anchor', link: 'http://a.com/image.jpg?test=param#anchor' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.JPG', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(6);
		expect(fakeTumblrClient.photo.calls[5].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[5].args[1]).toEqual({ tags: 'photo', source: 'http://a.com/image.JPG', link: 'http://a.com/image.JPG' });
	});

	it("should post a photo on demand with additional context if provided", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['photo']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto check this out http://a.com/image.jpg', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(1);
		expect(fakeTumblrClient.photo.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[0].args[1]).toEqual({ tags: 'photo', caption: 'check this out http://a.com/image.jpg', source: 'http://a.com/image.jpg', link: 'http://a.com/image.jpg' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto http://a.com/image.jpg check this out', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(2);
		expect(fakeTumblrClient.photo.calls[1].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[1].args[1]).toEqual({ tags: 'photo', caption: 'http://a.com/image.jpg check this out', source: 'http://a.com/image.jpg', link: 'http://a.com/image.jpg' });

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto check this http://a.com/image.jpg out', false, false)).toEqual(true);
		expect(fakeTumblrClient.photo.calls.length).toEqual(3);
		expect(fakeTumblrClient.photo.calls[2].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[2].args[1]).toEqual({ tags: 'photo', caption: 'check this http://a.com/image.jpg out', source: 'http://a.com/image.jpg', link: 'http://a.com/image.jpg' });
	});

	it("should not post a photo on demand if no links are provided", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['photo']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', '!postphoto no links here http://', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo).not.toHaveBeenCalled();
	});

	it("should post a quote on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['quote']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		var quote = 'this is a quote';

		expect(trigger.onChatMessage('roomId', 'userId', '!postquote ' + quote, false, false)).toEqual(true);
		expect(fakeTumblrClient.quote.calls.length).toEqual(1);
		expect(fakeTumblrClient.quote.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.quote.calls[0].args[1]).toEqual({ quote: quote, tags: 'quote' });
	});

	it("should post a link on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

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
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		var conversation = '9:30 PM - User 1: first message\
9:30 PM - User 2: second message';

		expect(trigger.onChatMessage('roomId', 'userId', '!postchat ' + conversation, false, false)).toEqual(true);
		expect(fakeTumblrClient.chat.calls.length).toEqual(1);
		expect(fakeTumblrClient.chat.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.chat.calls[0].args[1]).toEqual({ conversation: conversation, tags: 'chat' });
	});

	it("should post audio on demand", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

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
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

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

	it("should not post malformed links automatically", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'mailto link mailto://email@host.com', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'invalid schema link htp://www.google.com', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'bad link http://', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'bad link 2 http://!', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'bad link 3 http://?', false, false)).toEqual(false);

		expect(fakeTumblrClient.link).not.toHaveBeenCalled();
		expect(fakeTumblrClient.photo).not.toHaveBeenCalled();
		expect(fakeTumblrClient.video).not.toHaveBeenCalled();
		expect(fakeTumblrClient.audio).not.toHaveBeenCalled();
	});

	it("should post generic links as links automatically", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		// Automatic posts should always return false
		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(1);
		expect(fakeTumblrClient.link.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[0].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com with context', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(2);
		expect(fakeTumblrClient.link.calls[1].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[1].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com', description: 'http://www.google.com with context' });

		expect(trigger.onChatMessage('roomId', 'userId', 'multiple links http://x.com http://y.com', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(3);
		expect(fakeTumblrClient.link.calls[2].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[2].args[1]).toEqual({ tags: 'link', url: 'http://x.com', description: 'multiple links http://x.com http://y.com' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/page', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(4);
		expect(fakeTumblrClient.link.calls[3].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[3].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com/page' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/page?q1=x', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(5);
		expect(fakeTumblrClient.link.calls[4].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[4].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com/page?q1=x' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/page?q1=x&q2=y#anchor', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(6);
		expect(fakeTumblrClient.link.calls[5].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[5].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com/page?q1=x&q2=y#anchor' });
	});

	it("should post image links as photos automatically", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/image.jpg', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo.calls.length).toEqual(1);
		expect(fakeTumblrClient.photo.calls[0].args[1]).toEqual({ tags: 'photo', source: 'http://www.google.com/image.jpg', link: 'http://www.google.com/image.jpg' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/image.jpeg', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo.calls.length).toEqual(2);
		expect(fakeTumblrClient.photo.calls[1].args[1]).toEqual({ tags: 'photo', source: 'http://www.google.com/image.jpeg', link: 'http://www.google.com/image.jpeg' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/image.jpeg', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo.calls.length).toEqual(3);
		expect(fakeTumblrClient.photo.calls[2].args[1]).toEqual({ tags: 'photo', source: 'http://www.google.com/image.jpeg', link: 'http://www.google.com/image.jpeg' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/image.png', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo.calls.length).toEqual(4);
		expect(fakeTumblrClient.photo.calls[3].args[1]).toEqual({ tags: 'photo', source: 'http://www.google.com/image.png', link: 'http://www.google.com/image.png' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/image.bmp', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo.calls.length).toEqual(5);
		expect(fakeTumblrClient.photo.calls[4].args[1]).toEqual({ tags: 'photo', source: 'http://www.google.com/image.bmp', link: 'http://www.google.com/image.bmp' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/image.JPg', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo.calls.length).toEqual(6);
		expect(fakeTumblrClient.photo.calls[5].args[1]).toEqual({ tags: 'photo', source: 'http://www.google.com/image.JPg', link: 'http://www.google.com/image.JPg' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/image.jpg context', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo.calls.length).toEqual(7);
		expect(fakeTumblrClient.photo.calls[6].args[1]).toEqual({ tags: 'photo', source: 'http://www.google.com/image.jpg', link: 'http://www.google.com/image.jpg', caption: 'http://www.google.com/image.jpg context' });

		expect(fakeTumblrClient.link).not.toHaveBeenCalled();
	});

	it("should post bad image links as links", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/image .jpg', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/xjpg', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/a.jpg?x=y', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/a.jpg#a', false, false)).toEqual(false);

		expect(fakeTumblrClient.photo).not.toHaveBeenCalled();
		expect(fakeTumblrClient.link.calls.length).toEqual(4);
	});

	it("should post tumblr gifs as photos", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio', 'text']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'http://25.media.tumblr.com/x/x.gif', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo.calls.length).toEqual(1);
		expect(fakeTumblrClient.photo.calls[0].args[1]).toEqual({ tags: 'photo', source: 'http://25.media.tumblr.com/x/x.gif', link: 'http://25.media.tumblr.com/x/x.gif' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://25.media.tumblr.com/x/x.gif context', false, false)).toEqual(false);
		expect(fakeTumblrClient.photo.calls.length).toEqual(2);
		expect(fakeTumblrClient.photo.calls[1].args[1]).toEqual({ tags: 'photo', source: 'http://25.media.tumblr.com/x/x.gif', link: 'http://25.media.tumblr.com/x/x.gif', caption: 'http://25.media.tumblr.com/x/x.gif context' });

		expect(fakeTumblrClient.link).not.toHaveBeenCalled();
		expect(fakeTumblrClient.text).not.toHaveBeenCalled();
	});

	it("should post non-tumblr gifs as HTML text tagged as photo", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio', 'text']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'http://i.imgur.com/x.gif', false, false)).toEqual(false);
		
		expect(fakeTumblrClient.text.calls.length).toEqual(1);
		expect(fakeTumblrClient.text.calls[0].args[1]).toEqual({ tags: 'photo', body: '<img src="http://i.imgur.com/x.gif">' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://i.imgur.com/x.gif context', false, false)).toEqual(false);
		expect(fakeTumblrClient.text.calls.length).toEqual(2);
		expect(fakeTumblrClient.text.calls[1].args[1]).toEqual({ tags: 'photo', body: '<img src="http://i.imgur.com/x.gif"><br>http://i.imgur.com/x.gif context' });

		expect(fakeTumblrClient.link).not.toHaveBeenCalled();
		expect(fakeTumblrClient.photo).not.toHaveBeenCalled();
	});

	it("should post video links as video automatically", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.youtube.com/watch?v=xx', false, false)).toEqual(false);
		expect(fakeTumblrClient.video.calls.length).toEqual(1);
		expect(fakeTumblrClient.video.calls[0].args[1]).toEqual({ tags: 'video', embed: 'http://www.youtube.com/watch?v=xx' });

		expect(trigger.onChatMessage('roomId', 'userId', 'https://www.youtube.com/watch?v=xx context', false, false)).toEqual(false);
		expect(fakeTumblrClient.video.calls.length).toEqual(2);
		expect(fakeTumblrClient.video.calls[1].args[1]).toEqual({ tags: 'video', embed: 'https://www.youtube.com/watch?v=xx', caption: 'https://www.youtube.com/watch?v=xx context' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://vimeo.com/xx', false, false)).toEqual(false);
		expect(fakeTumblrClient.video.calls.length).toEqual(3);
		expect(fakeTumblrClient.video.calls[2].args[1]).toEqual({ tags: 'video', embed: 'http://vimeo.com/xx' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://x.subdomain.vimeo.com/xx', false, false)).toEqual(false);
		expect(fakeTumblrClient.video.calls.length).toEqual(4);
		expect(fakeTumblrClient.video.calls[3].args[1]).toEqual({ tags: 'video', embed: 'http://x.subdomain.vimeo.com/xx' });

		expect(fakeTumblrClient.link).not.toHaveBeenCalled();
	});

	it("should post bad video links as links", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.youtube.com/', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.youtube.com', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'http://theyoutube.com/xx', false, false)).toEqual(false);
		expect(trigger.onChatMessage('roomId', 'userId', 'http://youtubed.com/xx', false, false)).toEqual(false);

		expect(fakeTumblrClient.video).not.toHaveBeenCalled();
		expect(fakeTumblrClient.link.calls.length).toEqual(4);
	});

	it("should post audio links as audio automatically", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'http://google.com/audio.mp3', false, false)).toEqual(false);
		expect(fakeTumblrClient.audio.calls.length).toEqual(1);
		expect(fakeTumblrClient.audio.calls[0].args[1]).toEqual({ tags: 'audio', external_url: 'http://google.com/audio.mp3' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://google.com/aud(iox-x.mp3', false, false)).toEqual(false);
		expect(fakeTumblrClient.audio.calls.length).toEqual(2);
		//expect(fakeTumblrClient.audio.calls[1].args[1]).toEqual({ tags: 'audio', external_url: 'http://google.com/audio(x-.mp3' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://google.com/audio.wav context', false, false)).toEqual(false);
		expect(fakeTumblrClient.audio.calls.length).toEqual(3);
		expect(fakeTumblrClient.audio.calls[2].args[1]).toEqual({ tags: 'audio', external_url: 'http://google.com/audio.wav', caption: 'http://google.com/audio.wav context' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://soundcloud.com/xx', false, false)).toEqual(false);
		expect(fakeTumblrClient.audio.calls.length).toEqual(4);
		expect(fakeTumblrClient.audio.calls[3].args[1]).toEqual({ tags: 'audio', external_url: 'http://soundcloud.com/xx' });

		expect(trigger.onChatMessage('roomId', 'userId', 'https://x.subdomain.soundcloud.com/xx', false, false)).toEqual(false);
		expect(fakeTumblrClient.audio.calls.length).toEqual(5);
		expect(fakeTumblrClient.audio.calls[4].args[1]).toEqual({ tags: 'audio', external_url: 'https://x.subdomain.soundcloud.com/xx' });

		expect(fakeTumblrClient.link).not.toHaveBeenCalled();
	});

	it("should not post context if the autoPostContext option is false", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: false, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'context http://www.google.com context', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(1);
		expect(fakeTumblrClient.link.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[0].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com' });
	});

	it("should not post context if the autoPostContext option is missing", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'context http://www.google.com context', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(1);
		expect(fakeTumblrClient.link.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[0].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com' });
	});

	it("should post each link separately if the autoPostContext option is false", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: true, autoPostContext: false, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'context http://www.google.com/1 context http://www.google.com/2', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(2);
		expect(fakeTumblrClient.link.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[0].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com/1' });
		expect(fakeTumblrClient.link.calls[1].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[1].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com/2' });

		expect(trigger.onChatMessage('roomId', 'userId', 'http://google.com/audio.mp3 http://www.youtube.com/watch?v=xx http://www.google.com/image.jpg', false, false)).toEqual(false);
		expect(fakeTumblrClient.link.calls.length).toEqual(2);
		expect(fakeTumblrClient.audio.calls.length).toEqual(1);
		expect(fakeTumblrClient.audio.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.audio.calls[0].args[1]).toEqual({ tags: 'audio', external_url: 'http://google.com/audio.mp3' });
		expect(fakeTumblrClient.video.calls.length).toEqual(1);
		expect(fakeTumblrClient.video.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.video.calls[0].args[1]).toEqual({ tags: 'video', embed: 'http://www.youtube.com/watch?v=xx' });
		expect(fakeTumblrClient.photo.calls.length).toEqual(1);
		expect(fakeTumblrClient.photo.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.photo.calls[0].args[1]).toEqual({ tags: 'photo', source: 'http://www.google.com/image.jpg', link: 'http://www.google.com/image.jpg' });
	});

	it("should not auto-post links if the autoPost option is false", function() {
		var fakeTumblrClient = jasmine.createSpyObj('fakeTumblrClient', ['link', 'photo', 'video', 'audio']);
		var trigger = TumblrTrigger.create("tumblrTrigger", fakeBot, { blogName: 'blogname', autoPost: false, tumblr: fakeTumblrClient } );

		expect(trigger.onChatMessage('roomId', 'userId', 'http://www.google.com/1', false, false)).toEqual(false);
		expect(fakeTumblrClient.link).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', '!postlink http://www.google.com/1', false, false)).toEqual(true);
		expect(fakeTumblrClient.link.calls.length).toEqual(1);
		expect(fakeTumblrClient.link.calls[0].args[0]).toEqual('blogname');
		expect(fakeTumblrClient.link.calls[0].args[1]).toEqual({ tags: 'link', url: 'http://www.google.com/1' });
	});
});
