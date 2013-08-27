var util = require('util');
var winston = require('winston');
var tumblr = require('tumblr.js');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that posts things to tumblr - any links posted in chat and other things on-demand.
Post type commands are !postphoto, !postquote, !posttext, !postlink, !postchat, !postaudio, !postvideo
Links from chat will be posted based on their URL:
	- Any links ending in .jpg, .jpeg, .png, .bmp will be posted as a photo
	- Any links ending in .gif from the host tumblr.com will be posted as a photo
	- Any links ending in .gif not from the host tumblr.com will be posted as text as an img tag, and will be tagged as photo
	- Any links from the hosts youtube.com, youtu.be, or vimeo.com will be posted as video
	- Any links ending in .mp3, .wav, .wma, .m4a or from host soundcloud.com will be posted as audio

autoPost = boolean - if this is true, all detected links will be posted, even if no commands are used
autoPostContext = boolean - if this is true, the full text of any message that contains a link will be posted to tumblr, 
	if it's false then only the links themselves will be posted
blogName = string - the name part of the tumblr URL (http://<this>.tumblr.com/)
AND
tumblr = object - a tumblr blog object
OR all of the following (see http://www.tumblr.com/docs/en/api/v2)
consumerKey = string
consumerSecret = string
token = string
tokenSecret = string
*/

var TumblrTrigger = function() {
	TumblrTrigger.super_.apply(this, arguments);
};

util.inherits(TumblrTrigger, BaseTrigger);

var type = "TumblrTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new TumblrTrigger(type, name, chatBot, options);

	trigger.blog = trigger.options.tumblr || 
		new tumblr.createClient({
			consumer_key: trigger.options.consumerKey,
			consumer_secret: trigger.options.consumerSecret,
			token: trigger.options.token,
			token_secret: trigger.options.tokenSecret
		});

	return trigger;
};

var postPhotoCommand = '!postphoto';
var postQuoteCommand = '!postquote';
var postTextCommand = '!posttext';
var postLinkCommand = '!postlink';
var postChatCommand = '!postchat';
var postAudioCommand = '!postaudio';
var postVideoCommand = '!postvideo';

var urlRegex = /(https?|ftp|file):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;\(\)]*[-A-Za-z0-9+&@#\/%=~_|]/i;
var fileTypeRegexString = "^.+\\.({0})$"; // assumes urlRegex is already a match
var hostRegexString = "^(https?|ftp|file):\\/\\/([\\w-]+\\.)*({0})\\/.+$"; // assumes urlRegex is already a match

// Return true if a command was interpreted (so no other responses should occur)
TumblrTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	if (this._performCommand(roomId, message, chatterId)) {
		return true;
	}

	if (!this.options.autoPost) {
		return false;
	}

	if (this.options.autoPostContext) {
		this._postLinksWithContext(message, chatterId);
	}
	else {
		this._postLinksWithoutContext(message, chatterId);	
	}

	// Don't return true as we want to allow other responses
	return false;
}

TumblrTrigger.prototype._performCommand = function(roomId, message, userId) {
var that = this;
try {
	var firstWord = message.split(' ').shift();
	var otherWords = message.replace(firstWord, '').trim();

	// Make sure there is something to post
	if (!otherWords) {
		return false;
	}

	var linkData = _extractFirstLink(otherWords);

	switch (firstWord) {
		case postPhotoCommand: 
			return _postPhoto(linkData.link, linkData.context, that);
		case postLinkCommand: 
			return _postLink(linkData.link, linkData.context, that);
		case postAudioCommand: 
			return _postAudio(linkData.link, linkData.context, that);
		case postVideoCommand: 
			return _postVideo(linkData.link, linkData.context, that);
		case postQuoteCommand: 
			return _postQuote(otherWords, that);
		case postTextCommand: 
			return _postText(otherWords, that);
		case postChatCommand: 
			return _postChat(otherWords, that);
	}

	return false;
} catch(err) { console.log(err); }
}

TumblrTrigger.prototype._postLinksWithContext = function(message, userId) {	
	var linkData = _extractFirstLink(message);
	if (!linkData.link) {
		return;
	}

	_postUrlWithContext(linkData.link, linkData.context, this);
}

TumblrTrigger.prototype._postLinksWithoutContext = function(message, userId) {	
	var links = _extractLinksWithoutContext(message);

	for (var i=0; i < links.length; i++) {
		_postUrlWithContext(links[i].link, null, this);
	};
}

var _postUrlWithContext = function(link, context, trigger) {
try {
	if (_linkIsImage(link) || _linkIsTumblrGif(link)) {
		_postPhoto(link, context, trigger);
	}
	else if (_linkIsGif(link)) {
		_postNonTumblrGif(link, context, trigger);
	}
	else if (_linkIsVideo(link)) {
		_postVideo(link, context, trigger);
	}
	else if (_linkIsAudio(link)) {
		_postAudio(link, context, trigger);
	}
	else {
		_postLink(link, context, trigger);
	}
} catch(err) { console.log(err); }
};

var _linkIsImage = function(url) {
	return _checkListRegex(url, fileTypeRegexString, ['jpg', 'jpeg', 'png', 'bmp']);
};

var _linkIsTumblrGif = function(url) {
	return _checkListRegex(url, fileTypeRegexString, ['gif'])
	       && _checkListRegex(url, hostRegexString, ['tumblr\\.com']);
};

var _linkIsGif = function(url) {
	return _checkListRegex(url, fileTypeRegexString, ['gif']);
};

var _linkIsVideo = function(url) {
	return _checkListRegex(url, hostRegexString, ['youtube\\.com', 'youtu\\.be', 'vimeo\\.com']);
};

var _linkIsAudio = function(url) {
	return _checkListRegex(url, fileTypeRegexString, ['mp3', 'wav', 'wma', 'm4a']) ||
	       _checkListRegex(url, hostRegexString, ['soundcloud\\.com']);
};

var _checkListRegex = function(url, regexString, list) {
	var listString = list.join('|');
	var regex = new RegExp(regexString.replace('{0}', listString), 'i');

	var matches = url.match(regex);
	return (matches && matches.length > 0);
};

var _postPhoto = function(link, context, trigger) {
	if (!link) {
		return false;
	}

	winston.info("Posting photo " + link + " with context " + context + " to tumblr");

	var postOptions = { tags: 'photo', source: link, link: link };
	if (context) {
		postOptions.caption = context;
	}

	trigger.blog.photo(trigger.options.blogName, postOptions, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});

	return true;
};

var _postNonTumblrGif = function(link, context, trigger) {
	if (!link) {
		return false;
	}

	winston.info("Posting non-tumblr gif " + link + " with context " + context + " to tumblr");

	var postOptions = { tags: 'photo', body: '<img src="' + link + '">' };
	if (context) {
		postOptions.body += '<br>' + context;
	}

	trigger.blog.text(trigger.options.blogName, postOptions, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});

	return true;
};

var _postQuote = function(post, trigger) {
	winston.info("Posting quote to tumblr: " + post);

	trigger.blog.quote(trigger.options.blogName, { quote: post, tags: 'quote' }, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
};

var _postText = function(post, trigger) {
	winston.info("Posting text to tumblr: " + post);
	
	trigger.blog.text(trigger.options.blogName, { body: post, tags: 'text' }, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
};

var _postLink = function(link, context, trigger) {
	if (!link) {
		return false;
	}

	winston.info("Posting link " + link + " with context " + context + " to tumblr");

	var postOptions = { tags: 'link', url: link};
	if (context) {
		postOptions.description = context;
	}

	trigger.blog.link(trigger.options.blogName, postOptions, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
};

var _postChat = function(post, trigger) {
	winston.info("Posting chat to tumblr: " + post);
	
	trigger.blog.chat(trigger.options.blogName, { conversation: post, tags: 'chat' }, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
};

var _postAudio = function(link, context, trigger) {
	if (!link) {
		return false;
	}

	winston.info("Posting audio " + link + " with context " + context + " to tumblr");
	
	var postOptions = { tags: 'audio', external_url: link};
	if (context) {
		postOptions.caption = context;
	}

	trigger.blog.audio(trigger.options.blogName, postOptions, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
};

var _postVideo = function(link, context, trigger) {
	if (!link) {
		return false;
	}

	winston.info("Posting video " + link + " with context " + context + " to tumblr");

	var postOptions = { tags: 'video', embed: link};
	if (context) {
		postOptions.caption = context;
	}

	trigger.blog.video(trigger.options.blogName, postOptions, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
};

var _logResult = function(err, result, blogName) {
	if (err) {
		winston.info("Error posting to tumblr", err)
	}
	else if (result) {
		winston.info("Posted to " + 'http://' + blogName + '.tumblr.com/post/' + result.id);
	}
};

var _extractLinksWithoutContext = function(message) {
	// Not the best way but it will work for steam
	var words = message.split(' ');

	var links = [];
	for (var i=0; i < words.length; i++) {
		var linkData = _extractFirstLink(words[i]);
		if (linkData.link) {
			links.push(linkData);
		}
	}

	return links;
};


// Returns a map containing the first link (if any) and additional context if there is more than just the link
var _extractFirstLink = function(message) {
	var data = { context: message };

	var matches = message.match(urlRegex);
	if (matches && matches.length > 0) {
		data.link = matches[0];

		// If the link is without context, don't provide a context
		var strippedMessage = message.replace(data.link, '').trim();
		if (!strippedMessage) {
			delete data.context;
		}
	}

	return data;
};
