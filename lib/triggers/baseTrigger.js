var _ = require("lodash");

/*
Base class for all triggers, contining shared implementation code.
Relevant options shared across all triggers:
delay = number - delay between when a _sendMessageAfterDelay is called to when it is actually sent to steam
probability = number - before any other checks occur, a random number generated between 0-1 must be smaller than this number
timeout = - after the trigger fires, it cannot be fired again until after this timout lapses
*/

var BaseTrigger = function(type, name, chatBot, options) {
	this.type = type;
	this.chatBot = chatBot;
	this.name = name;
	this.options = options || {};
	this.respectsMute = true;
	this.respectsFilters = true;
	this.respectsGlobalFilters = true;
	this.allowMessageTriggerAfterResponse = false;
	this.replyEnabled = true;
	this.winston = chatBot.winston;
	this.steamtrade = chatBot.steamtrade;
	this.admins = chatBot.admins;
	this.roomNames = chatBot.roomNames;
	this.steamapikey = chatBot.steamapikey;
	this._userName = chatBot._userName;
	this._userString = chatBot._userString;
};

exports.BaseTrigger = BaseTrigger;
var type = "BaseTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	return new BaseTrigger(type, name, chatBot, options);
};

// Public interface of all triggers
BaseTrigger.prototype.getOptions = function() {
	return _.clone(this.options);
}

BaseTrigger.prototype.onLoad = function() {
	var that = this;
	try {
		var ret = that._onLoad();
		if(!ret) {
			that.winston.error(that.chatBot.name+"/baseTrigger.js: ERROR loading trigger "+that.name+": onLoaded returned '"+ret+"'.");
			return false;
		}
		return true;
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
	}
}

BaseTrigger.prototype.onLoggedOn = function() {
	var that = this;
	try {
		return that._onLoggedOn();
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
	}
}

BaseTrigger.prototype.onLoggedOff = function() {
	var that = this;
	try {
		return that._onLoggedOff();
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
	}
}

// Returns true if the invite is accepted
BaseTrigger.prototype.onChatInvite = function(roomId, roomName, inviterId) {
	var that = this;
	if(that._checkUser(inviterId) && that._checkRoom(roomId) && !that._checkIgnores(roomId,inviterId)) { //Thanks @dungdung
		try { return that._respondToChatInvite(roomId, roomName, inviterId); }
		catch(err) { that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false; }
	}
}

// Returns true if the request is accepted
BaseTrigger.prototype.onFriendRequest = function(userId) {
	var that = this;
	try {
		return that._respondToFriendRequest(userId);
	} catch(err) { that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false; }
}

// Return true if a message was sent
BaseTrigger.prototype.onFriendMessage = function(userId, message, haveSentMessage) {
	var that = this;
	if (this.replyEnabled && this._randomRoll() && this._checkMultiResponse(haveSentMessage) && this._checkUser(userId) && !this._checkIgnores(userId, null)) {
		try{
			var messageSent = that._respondToFriendMessage(userId, message);
			if (messageSent) {
				that.winston.silly(that.chatBot.name+"/"+that.name+": sent respondToFriendMessage - "+userId+" - "+message);
				that._disableForTimeout();
			}
			return messageSent;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

//When someone sends a tradeoffer
BaseTrigger.prototype.onTradeOffer = function(number, haveEatenEvent) {
	var that = this;
	if (this._checkMultiResponse(haveEatenEvent)) {
		try{
			var eventEaten = that._respondToTradeOffer(number);
			if (eventEaten) {
				that.winston.silly(that.chatBot.name+"/"+that.name+": sent respondToTradeOffer: "+number);
			}
			return eventEaten;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

//When someone sends a trade invite
BaseTrigger.prototype.onTradeProposed = function(tradeID,userId,haveEatenEvent) {
	var that = this;
	if (this._checkMultiResponse(haveEatenEvent) && this._checkUser(userId) && !this._checkIgnores(userId, null)) {
		try{
			var eventEaten = that._respondToTradeProposal(tradeID,userId);
			if (eventEaten) {
				that.winston.silly(that.chatBot.name+"/"+that.name+": responded to trade invite "+tradeId);
			}
			return eventEaten;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

//When someone sends a trade invite
BaseTrigger.prototype.onTradeSession = function(userId,haveEatenEvent) {
	var that = this;
	if (this._checkMultiResponse(haveEatenEvent) && this._checkUser(userId) && !this._checkIgnores(userId, null)) {
		try{
			var eventEaten = that._respondToTradeSession(userId);
			if (eventEaten) {
				that.winston.silly(that.chatBot.name+"/"+that.name+": opened trade with "+userId);
			}
			return eventEaten;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}
//When someone sends a trade invite
BaseTrigger.prototype.onAnnouncement = function(groupID,headline,haveEatenEvent) {
	var that = this;
	if (this._checkMultiResponse(haveEatenEvent) && !this._checkIgnores(groupID, null)) {
		try{
			var eventEaten = that._respondToAnnouncement(groupID, headline);
			if (eventEaten) {
				that.winston.silly(that.chatBot.name+"/"+that.name+": responded to "+groupID+"'s announcement");
			}
			return eventEaten;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

// Return true if we've seen the message but don't want any other plugins to see it.
BaseTrigger.prototype.onSentMessage = function(toId, message, haveSentMessage) {
	var that=this;
	try{
		var messageSeen = that._respondToSentMessage(toId, message);
		if (messageSeen) {
			return true;
		}
		return messageSeen;
	} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype.onChatMessage = function(roomId, chatterId, message, haveSentMessage, muted) {
	var that=this;
	if (that.replyEnabled && that._randomRoll() && that._checkMultiResponse(haveSentMessage) && that._checkMute(muted) && that._checkUser(chatterId) && that._checkRoom(roomId) && !that._checkIgnores(chatterId,roomId)) {
		try{
			var messageSent = that._respondToChatMessage(roomId, chatterId, message);
			if (messageSent) {
				that.winston.silly(that.chatBot.name+"/"+that.name+": sent respondToChatMessage - "+chatterId+" - "+roomId+" - "+message);
				that._disableForTimeout();
			}
			return messageSent;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype.onEnteredChat = function(roomId, userId, haveSentMessage, muted) {
	var that=this;
	if (that.replyEnabled && that._randomRoll() && that._checkMultiResponse(haveSentMessage) && that._checkMute(muted) && that._checkRoom(roomId) && !that._checkIgnores(userId,roomId)) {
		try{
			var messageSent = that._respondToEnteredMessage(roomId, userId);
			if (messageSent) {
				that._disableForTimeout();
			}
			return messageSent;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype.onKickedChat = function(roomId, kickedId, kickerId, haveSentMessage, muted) {
	var that=this;
	if (that.replyEnabled && that._randomRoll() && that._checkMultiResponse(haveSentMessage) && that._checkMute(muted) && that._checkRoom(roomId)) {
		try{
			var messageSent = that._respondToKick(roomId, kickedId, kickerId);
			if (messageSent) {
				that._disableForTimeout();
			}
			return messageSent;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

BaseTrigger.prototype.onBannedChat = function(roomId, bannedId, bannerId, haveSentMessage, muted) {
	var that=this;
	if (that.replyEnabled && that._randomRoll() && that._checkMultiResponse(haveSentMessage) && that._checkMute(muted) && that._checkRoom(roomId)) {
		try{
			var messageSent = that._respondToBan(roomId,bannedId,bannerId);
			if (messageSent) {
				that._disableForTimeout();
			}
			return messageSent;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype.onDisconnected = function(roomId, userId, haveSentMessage, muted) {
	var that=this;
	if (that.replyEnabled && that._randomRoll() && that._checkMultiResponse(haveSentMessage) && that._checkMute(muted) && that._checkRoom(roomId) && !that._checkIgnores(userId,roomId)) {
		try{
			var messageSent = that._respondToDisconnect(roomId, userId);
			if (messageSent) {
				that._disableForTimeout();
			}
			return messageSent;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype.onLeftChat = function(roomId, userId, muted) {
	var that = this;
	if (that.replyEnabled && that._randomRoll() && that._checkMute(muted) && that._checkUser(userId) && that._checkRoom(roomId) && !that._checkIgnores(roomId,userId)) {
		try{
			var messageSent = that._respondToLeftMessage(roomId, userId);
			if (messageSent) {
				that._disableForTimeout();
			}
			return messageSent;
		} catch(err) {that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack); return false;}
	}
	return false;
}

// Subclasses should override the relevant functions below
//Returns true if the function loads properly. If not, returns false. If you *require* parameters, check them here to make sure they're defined.
BaseTrigger.prototype._onLoad = function() {
	return true;
}

BaseTrigger.prototype._onLoggedOn = function() {
	return true;
}

BaseTrigger.prototype._onLoggedOff = function() {
	return true;
}

// Returns true if the invite is accepted
BaseTrigger.prototype._respondToChatInvite = function(roomId, roomName, inviterId) {
	return false;
}

// Returns true if the request is accepted
BaseTrigger.prototype._respondToFriendRequest = function(userId) {
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return false;
}

// Return true if a sent message has been used and shouldn't be seen again.
BaseTrigger.prototype._respondToSentMessage = function(toId, message) {
	return false;
}

// Return true if a message was sent
BaseTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return false;
}

// Return true if the event was eaten
BaseTrigger.prototype._respondToEnteredMessage = function(roomId,userId) {
	return false;
}

// Return true if the event was eaten
BaseTrigger.prototype._respondToBan = function(roomId,bannedId,bannerId) {
	return false;
}

// Return true if the event was eaten
BaseTrigger.prototype._respondToDisconnect = function(roomId,userId) {
	return false;
}

// Return true if the event was eaten
BaseTrigger.prototype._respondToLeftMessage = function(roomId, userId) {
	return false;
}

// Return true if the event was eaten
BaseTrigger.prototype._respondToKick = function(roomId,kickedId,kickerId) {
	return false;
}

BaseTrigger.prototype._respondToAnnouncement = function(groupID, headline) {
	return false;
}

BaseTrigger.prototype._respondToTradeSession = function(userId) {
	return false;
}

BaseTrigger.prototype._respondToTradeProposal = function(tradeId, steamId) {
	return false;
}

BaseTrigger.prototype._respondToTradeOffer = function(number) {
	return false;
}

// Helper functions

BaseTrigger.prototype._checkMute = function(muted) {
	return !muted || !this.respectsMute;
}

BaseTrigger.prototype._checkMultiResponse = function(haveSentMessage) {
	return !haveSentMessage || this.allowMessageTriggerAfterResponse;
}

BaseTrigger.prototype._randomRoll = function() {
	if (this.options.probability) {
		var random = Math.random();
		if (random > this.options.probability) {
			return false;
		}
	}

	return true;
}

BaseTrigger.prototype._sendMessageAfterDelay = function(steamId, message) {
	var that = this;
	if (this.options.delay) {
		this.winston.silly(this.chatBot.name+"/"+this.name,{"trigger":this.name,"type":this.type,"target: ":steamId,"message":message, "delay":this.options.delay});
		setTimeout(function () {
			that.winston.silly(that.chatBot.name+"/"+that.name+": sending delayed message to "+steamId+": "+message);
			that.chatBot.sendMessage(steamId, message);
		}, this.options.delay);
	}
	else {
		that.winston.silly(that.chatBot.name+"/"+that.name+": sending nondelayed message to "+steamId+": "+message);
		this.chatBot.sendMessage(steamId, message);
	}
}

BaseTrigger.prototype._disableForTimeout = function() {
	if (this.options.timeout) {
		this.replyEnabled = false;
		var that = this;
		that.winston.silly(that.chatBot.name+"/"+that.name+": setting timeout ("+this.options.timeout+"ms)");
		setTimeout(function() {
			that.winston.silly(that.chatBot.name+"/"+that.name+": timeout expired");
			that.replyEnabled = true;
		}, this.options.timeout);
	}
}

// Check if this user/room is blacklisted for this command
/*
BaseTrigger.prototype._checkGlobalIgnores = function(toId, fromId) {
		if (this.options.ignore===false || (this.options.ignore && this.options.ignore.length === 0)) {
			return false;
		}
		return false;
	}
	return false;
}
*/
BaseTrigger.prototype._checkIgnores = function(toId, fromId) {
	if(this.respectsGlobalFilters && !(this.options.respectsGlobalFilters===false) && this.chatBot.options.ignores && this.chatBot.options.ignores.length > 0) {
		for (var i=0; i < this.chatBot.options.ignores.length; i++) {
			var ignored = this.chatBot.options.ignores[i];
			if (toId === ignored || fromId === ignored) {
				return true;
			}
		}
	}
	if(this.respectsFilters && this.options.ignore && this.options.ignore.length > 0) {
		for (var i=0; i < this.options.ignore.length; i++) {
			var ignored = this.options.ignore[i];
			if (toId === ignored || fromId === ignored) {
				return true;
			}
		}

		return false;
	}
	return false;
}

// Check for a specific room
BaseTrigger.prototype._checkRoom = function(toId) {
	if(this.respectsFilters) {
		if (!this.options.rooms || this.options.rooms.length === 0) {
			return true;
		}
		for (var i=0; i < this.options.rooms.length; i++) {
			var room = this.options.rooms[i];
			if (toId === room) {
				return true;
			}
		}

		return false;
	}
	return true;
}

// Check for a specific user
BaseTrigger.prototype._checkUser = function(fromId) {
	if(this.respectsFilters) {
		if (!this.options.users || this.options.users.length === 0) {
			return true;
		}

		for (var i=0; i < this.options.users.length; i++) {
			var user = this.options.users[i];
			if (fromId === user) {
				return true;
			}
		}

		return false;
	}
	return true;
}

//Add a router to the global webserver
BaseTrigger.prototype._addRouter = function(path){
	if(this.chatBot.options.disableWebServer) {
		this.winston.error(this.chatBot.name+"/"+this.name+": The webserver has been disabled, but "+this.type+"/"+this.name+" is trying to use it anyways!");
		return false; //triggers should deal with this on their own. It shouldn't get called. But if it does, we'll tell the user.
	}
	var that = this;
	try {
		return that.chatBot._addRouter(path);
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
	}
}
BaseTrigger.prototype._getSocket = function(path) {
	if(this.chatBot.options.disableWebServer) {
		this.winston.error(this.chatBot.name+"/"+this.name+": The webserver has been disabled, but "+this.type+"/"+this.name+" is trying to use websockets anyways!");
		return false; //triggers should deal with this on their own. It shouldn't get called. But if it does, we'll tell the user.
	}
	var that = this;
	try {
		return that.chatBot._getSocket(path);
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name+":",err.stack);
	}
}

/*
Skeleton for new triggers
-------------------------
var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

var NewTrigger = function() {
	NewTrigger.super_.apply(this, arguments);
};

util.inherits(NewTrigger, BaseTrigger);

var type = "NewTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new NewTrigger(type, name, chatBot, options);

	trigger.respectsMute = true;
	trigger.respectsFilters = true;
	// Other initializers

	return trigger;
};

NewTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	// etc
	return false;
}

// Other overrides/functions
*/
