var util = require("util");
var tumblr = require("tumblr.js");

var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

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

	trigger.options.postPhotoCommand = options.postPhotoCommand || "!postphoto";
	trigger.options.postQuoteCommand = options.postQuoteCommand || "!postquote";
	trigger.options.postTextCommand  = options.postTextCommand  || "!posttext";
	trigger.options.postLinkCommand  = options.postLinkCommand  || "!postlink";
	trigger.options.postChatCommand  = options.postChatCommand  || "!postchat";
	trigger.options.postAudioCommand = options.postAudioCommand || "!postaudio";
	trigger.options.postVideoCommand = options.postVideoCommand || "!postvideo";
	trigger.options.urlRegex = options.urlRegex || /(https?|ftp|file):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;\(\)]*[-A-Za-z0-9+&@#\/%=~_|]/i;
	trigger.options.fileTypeRegexString = options.fileTypeRegexString || "^.+\\.({0})$"; // assumes urlRegex is already a match
	trigger.options.hostRegexString = options.hostRegexString || "^(https?|ftp|file):\\/\\/([\\w-]+\\.)*({0})\\/.+$"; // assumes urlRegex is already a match
	return trigger;
};

TumblrTrigger.prototype._logResult = function(err, result, blogName) {
	if (err) {
		this.winston.info(this.chatBot.name+"/"+this.name+": Error posting to tumblr", err);
	}
	else if (result) {
		this.winston.info(this.chatBot.name+"/"+this.name+": Posted to " + "http://" + blogName + ".tumblr.com/post/" + result.id);
	}
};

TumblrTrigger.prototype._checkListRegex = function(url, regexString, list) {
	var listString = list.join("|");
	var regex = new RegExp(regexString.replace("{0}", listString), "i");

	var matches = url.match(regex);
	return (matches && matches.length > 0);
};

TumblrTrigger.prototype._linkIsImage = function(url) {
	return this._checkListRegex(url, this.options.fileTypeRegexString, ["jpg", "jpeg", "png", "bmp"]);
};

TumblrTrigger.prototype._linkIsTumblrGif = function(url) {
	return this._checkListRegex(url, this.options.fileTypeRegexString, ["gif"])
		&& this._checkListRegex(url, this.options.hostRegexString, ["tumblr\\.com"]);
};

TumblrTrigger.prototype._linkIsGif = function(url) {
	return this._checkListRegex(url, this.options.fileTypeRegexString, ["gif"]);
};

TumblrTrigger.prototype._linkIsVideo = function(url) {
	return this._checkListRegex(url, this.options.hostRegexString, ["youtube\\.com", "youtu\\.be", "vimeo\\.com"]);
};

TumblrTrigger.prototype._linkIsAudio = function(url) {
	return this._checkListRegex(url, this.options.fileTypeRegexString, ["mp3", "wav", "wma", "m4a"]) ||
		this._checkListRegex(url, this.options.hostRegexString, ["soundcloud\\.com"]);
};

TumblrTrigger.prototype._postPhoto = function(link, context) {
	var that = this;
	if (!link) {
		return false;
	}

	this.winston.info(this.chatBot.name+"/"+this.name+": Posting photo " + link + " with context " + context + " to tumblr");

	var postOptions = { tags: "photo", source: link, link: link };
	if (context) {
		postOptions.caption = context;
	}

	this.blog.photo(this.options.blogName, postOptions, function(err, result) {
		that._logResult(err, result, that.options.blogName);
	});

	return true;
};

TumblrTrigger.prototype._postNonTumblrGif = function(link, context) {
	var that = this;
	if (!link) {
		return false;
	}

	this.winston.info(this.chatBot.name+"/"+this.name+": Posting non-tumblr gif " + link + " with context " + context + " to tumblr");

	var postOptions = { tags: "photo", body: "<img src=\"" + link + "\">" };
	if (context) {
		postOptions.body += "<br>" + context;
	}

	this.blog.text(this.options.blogName, postOptions, function(err, result) {
		that._logResult(err, result, that.options.blogName);
	});

	return true;
};

TumblrTrigger.prototype._postQuote = function(post) {
	var that = this;
	this.winston.info(this.chatBot.name+"/"+this.name+": Posting quote to tumblr: " + post);

	this.blog.quote(this.options.blogName, { quote: post, tags: "quote" }, function(err, result) {
		that._logResult(err, result, that.options.blogName);
	});

	return true;
};

TumblrTrigger.prototype._postText = function(post) {
	var that = this;
	this.winston.info(this.chatBot.name+"/"+this.name+": Posting text to tumblr: " + post);

	this.blog.text(this.options.blogName, { body: post, tags: "text" }, function(err, result) {
		that._logResult(err, result, that.options.blogName);
	});

	return true;
};

TumblrTrigger.prototype._postLink = function(link, context) {
	var that = this;
	if (!link) {
		return false;
	}

	this.winston.info(this.chatBot.name+"/"+this.name+": Posting link " + link + " with context " + context + " to tumblr");

	var postOptions = { tags: "link", url: link};
	if (context) {
		postOptions.description = context;
	}

	this.blog.link(this.options.blogName, postOptions, function(err, result) {
		that._logResult(err, result, that.options.blogName);
	});

	return true;
};

TumblrTrigger.prototype._postChat = function(post) {
	this.winston.info(this.chatBot.name+"/"+this.name+": Posting chat to tumblr: " + post);

	var that = this;
	this.blog.chat(this.options.blogName, { conversation: post, tags: "chat" }, function(err, result) {
		that._logResult(err, result, that.options.blogName);
	});

	return true;
};

TumblrTrigger.prototype._postAudio = function(link, context) {
	if (!link) {
		return false;
	}

	this.winston.info(this.chatBot.name+"/"+this.name+": Posting audio " + link + " with context " + context + " to tumblr");

	var postOptions = { tags: "audio", external_url: link};
	if (context) {
		postOptions.caption = context;
	}
	var that = this;
	this.blog.audio(this.options.blogName, postOptions, function(err, result) {
		that._logResult(err, result, that.options.blogName);
	});

	return true;
};

TumblrTrigger.prototype._postVideo = function(link, context) {
	if (!link) {
		return false;
	}

	this.winston.info(this.chatBot.name+"/"+this.name+": Posting video " + link + " with context " + context + " to tumblr");

	var postOptions = { tags: "video", embed: link};
	if (context) {
		postOptions.caption = context;
	}
	var that = this;
	this.blog.video(this.options.blogName, postOptions, function(err, result) {
		that._logResult(err, result, that.options.blogName);
	});

	return true;
};

// Returns a map containing the first link (if any) and additional context if there is more than just the link
TumblrTrigger.prototype._extractFirstLink = function(message) {
	var data = { context: message };

	var matches = message.match(this.options.urlRegex);
	if (matches && matches.length > 0) {
		data.link = matches[0];

		// If the link is without context, don't provide a context
		var strippedMessage = message.replace(data.link, "").trim();
		if (!strippedMessage) {
			delete data.context;
		}
	}

	return data;
};

TumblrTrigger.prototype._extractLinksWithoutContext = function(message) {
	// Not the best way but it will work for steam
	var words = message.split(" ");

	var links = [];
	for (var i=0; i < words.length; i++) {
		var linkData = this._extractFirstLink(words[i]);
		if (linkData.link) {
			links.push(linkData);
		}
	}

	return links;
};

TumblrTrigger.prototype._postUrlWithContext = function(link, context) {
	try {
		if (_linkIsImage(link) || this._linkIsTumblrGif(link)) {
			this._postPhoto(link, context);
		}
		else if (_linkIsGif(link)) {
			this._postNonTumblrGif(link, context);
		}
		else if (_linkIsVideo(link)) {
			this._postVideo(link, context);
		}
		else if (_linkIsAudio(link)) {
			this._postAudio(link, context);
		}
		else {
			this._postLink(link, context);
		}
	} catch(err) {
		this.winston.error(this.chatBot.name+"/"+this.name,err);
	}
};

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
		var firstWord = message.split(" ").shift();
		var otherWords = message.replace(firstWord, "").trim();

		// Make sure there is something to post
		if (!otherWords) {
			return false;
		}

		var linkData = this._extractFirstLink(otherWords);

		switch (firstWord) {
			case that.options.postPhotoCommand:
				return this._postPhoto(linkData.link, linkData.context);
			case that.options.postLinkCommand:
				return this._postLink(linkData.link, linkData.context);
			case that.options.postAudioCommand:
				return this._postAudio(linkData.link, linkData.context);
			case that.options.postVideoCommand:
				return this._postVideo(linkData.link, linkData.context);
			case that.options.postQuoteCommand:
				return this._postQuote(otherWords);
			case that.options.postTextCommand:
				return this._postText(otherWords);
			case that.options.postChatCommand:
				return this._postChat(otherWords);
		}

		return false;
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name,err);
	}
}

TumblrTrigger.prototype._postLinksWithContext = function(message, userId) {
	var linkData = this._extractFirstLink(message);
	if (!linkData.link) {
		return;
	}

	this._postUrlWithContext(linkData.link, linkData.context);
}

TumblrTrigger.prototype._postLinksWithoutContext = function(message, userId) {
	var links = this._extractLinksWithoutContext(message);

	for (var i=0; i < links.length; i++) {
		this._postUrlWithContext(links[i].link, null);
	};
}
