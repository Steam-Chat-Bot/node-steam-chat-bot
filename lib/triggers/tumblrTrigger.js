var util = require('util');
var winston = require('winston');
var tumblr = require('tumblr.js');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Trigger that posts things to tumblr - any links posted in chat and other things on-demand.
Post type commands are !postphoto, !postquote, !posttext, !postlink, !postchat, !postaudio, !postvideo
Links from chat will be posted based on their URL, e.g. .png as an image, youtube links as a video, etc.

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
	TumblrTrigger.super_.call(this);
};

util.inherits(TumblrTrigger, BaseTrigger);

var postPhotoCommand = '!postphoto';
var postQuoteCommand = '!postquote';
var postTextCommand = '!posttext';
var postLinkCommand = '!postlink';
var postChatCommand = '!postchat';
var postAudioCommand = '!postaudio';
var postVideoCommand = '!postvideo';

var urlRegex = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/i; // http://stackoverflow.com/questions/8188645/javascript-regex-to-match-a-url-in-a-field-of-text
//var photoRegex = /https?:\/\/(?:[a-z\-]+\.)+[a-z]{2,6}(?:\/[^\/#?]+)+\.(?:jpg|gif|png)(?:\?([^#]*))?(?:#(.*))?/; // http://stackoverflow.com/questions/169625/regex-to-check-if-valid-url-that-ends-in-jpg-png-or-gif

// Return true if a command was interpreted (so no other responses should occur)
TumblrTrigger.prototype._respondToFriendMessage = function(userId, message) {
	//temporary, to swap with chat message
	/*
	if (this._performCommand(message, userId)) {
		return true;
	}
	else {
		this._postLinksFromMessage(message, userId);
		return false;
	}
	*/
	return false;
}

// Return true if a command was interpreted (so no other responses should occur)
TumblrTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	//temporary, to swap with friend message
	//return false;

	if (this._performCommand(message, chatterId)) {
		return true;
	}

	return false;
}

TumblrTrigger.prototype._performCommand = function(message, userId) {
	var firstWord = message.split(' ').shift();
	var otherWords = message.replace(firstWord, '').trim();

	// Make sure there is something to post
	if (!otherWords) {
		return false;
	}

	switch (firstWord) {
		case postPhotoCommand: 
			return _postPhoto(otherWords, userId, this);
		case postQuoteCommand: 
			return _postQuote(otherWords, userId, this);
		case postTextCommand: 
			return _postText(otherWords, userId, this);
		case postLinkCommand: 
			return _postLink(otherWords, userId, this);
		case postChatCommand: 
			return _postChat(otherWords, userId, this);
		case postAudioCommand: 
			return _postAudio(otherWords, userId, this);
		case postVideoCommand: 
			return _postVideo(otherWords, userId, this);
	}

	return false;
}

TumblrTrigger.prototype._postLinksFromMessage = function(message, userId) {
}


var _postToTumblr = function(postFunc, blogName, postOptions) {
	if (!postOptions) {
		return false;
	}

	postFunc(blogName, postOptions, function(err, result) {
		_logResult(err, result, blogName);
	});
	return true;
}

var _postPhoto = function(post, userId, trigger) {
	winston.info("Posting photo from " + userId + " to Tumblr: " + post);

	var linkData = _extractFirstLink(post);
	if (!linkData.link) {
		return false;
	}

	var postOptions = { tags: 'photo', source: linkData.link};
	if (linkData.context) {
		postOptions.caption = linkData.context;
	}

	trigger.blog.photo(trigger.options.blogName, postOptions, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});

	return true;
}

var _postQuote = function(post, userId, trigger) {
	winston.info("Posting quote from " + userId + " to Tumblr: " + post);

	trigger.blog.quote(trigger.options.blogName, { quote: post, tags: 'quote' }, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
}

var _postText = function(post, userId, trigger) {
	winston.info("Posting text from " + userId + " to Tumblr: " + post);
	
	trigger.blog.text(trigger.options.blogName, { body: post, tags: 'text' }, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
}

var _postLink = function(post, userId, trigger) {
	winston.info("Posting link from " + userId + " to Tumblr: " + post);
	
	var linkData = _extractFirstLink(post);
	if (!linkData.link) {
		return false;
	}

	var postOptions = { tags: 'link', url: linkData.link};
	if (linkData.context) {
		postOptions.description = linkData.context;
	}

	trigger.blog.link(trigger.options.blogName, postOptions, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
}

var _postChat = function(post, userId, trigger) {
	winston.info("Posting chat from " + userId + " to Tumblr: " + post);
	
	trigger.blog.chat(trigger.options.blogName, { conversation: post, tags: 'chat' }, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
}

var _postAudio = function(post, userId, trigger) {
	winston.info("Posting audio from " + userId + " to Tumblr: " + post);
	
	var linkData = _extractFirstLink(post);
	if (!linkData.link) {
		return false;
	}

	var postOptions = { tags: 'audio', external_url: linkData.link};
	if (linkData.context) {
		postOptions.caption = linkData.context;
	}

	trigger.blog.audio(trigger.options.blogName, postOptions, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
}

var _postVideo = function(post, userId, trigger) {
	winston.info("Posting video from " + userId + " to Tumblr: " + post);
	
	var linkData = _extractFirstLink(post);
	if (!linkData.link) {
		return false;
	}

	var postOptions = { tags: 'video', embed: linkData.link};
	if (linkData.context) {
		postOptions.caption = linkData.context;
	}

	trigger.blog.video(trigger.options.blogName, postOptions, function(err, result) {
		_logResult(err, result, trigger.options.blogName);
	});
	
	return true;
}

var _logResult = function(err, result, blogName) {
	if (err) {
		winston.info("Error posting to tumblr", err)
	}
	else if (result) {
		winston.info("Posted to " + 'http://' + blogName + '.tumblr.com/post/' + result.id);
	}
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
}

var type = "TumblrTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new TumblrTrigger();
	trigger.init(name, chatBot, options);
	trigger.type = type;
	trigger.blog = trigger.options.tumblr || 
		new tumblr.createClient({
			consumer_key: trigger.options.consumerKey,
			consumer_secret: trigger.options.consumerSecret,
			token: trigger.options.token,
			token_secret: trigger.options.tokenSecret
		});
	return trigger;
};