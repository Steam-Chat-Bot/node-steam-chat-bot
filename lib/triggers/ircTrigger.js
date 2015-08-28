var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var irc = require('irc');
var _ = require('lodash');
/*
Trigger that connects to specified IRC networks and channels, and sets up relays between one and the other.
// commented out options have not been fully implemented, it is recommended that you don't use them
options: {
	admins: ['76561198008335925'],
	respectsMute: false,
	defaults: {
		setAsBot: true, //set mode +B. You don't want to do this on servers that don't run Unreal. Check `/quote version` or `/raw version` on your server of choice.
		ircOptions: {
			userName: 'Efreak',
			realName: 'https://github.com/Efreak/node-steam-chat-bot',
		}
	},
	servers: [{
		name: 'Mibbit',
		nickname: 'SteamRelay',
		server: 'irc.mibbit.net',
		performs: ['PRIVMSG NickServ :identify efreak daniel8386','PRIVMSG Efreak :I\'m logged in!'],
	}],
	relays: [{
		server: 'Mibbit',
		channel: '#EndOfTheInternet',
		steamchat: '103582791433731577',
		steamchatName: 'YCJGTFO'
	}],
	debug: false //Debug functions removed, still prevents other functions from responding when a message gets relayed.
}
options: {
  admins: [steamid64,steamid64], //There's no commands yet, but eventually admins will be able to change modes, etc, and users will be able to see who's in chat.
  respectsMute: false,		//Should the relay respect mute? That is, should it stop relaying chat from IRC when you mute it. Default is false.
  defaults: { //default settings everywhere
    ircOptions: {  //this object will be passed into the irc object without checking it, other than sane defaults for the specific items below. Full options are available at https://node-irc.readthedocs.org/en/latest/API.html#internal
      userName: 'steamrelay'	//ident. default is 'steamrelay'. Maximum length by protocol is 10 characters (more than that gets discarded)
      realName: 'steam-chat-bot ircTrigger', //GECOS
      autoRejoin: true,	//true is default.
      channels: [],		//DO NOT USE THIS, it will be overridden.
      stripColors: true,	//You probably want to leave this alone
      messageSplit: 256,	//I believe the maximum length RFC 1459 allows for a message
			(including prefixes like command, target, CRLF at end, etc) is 512 characters.
			You probably don't want this any higher than 256 though, long messages are annoying.

      floodProtection: true,	//this queues your messages, you probably want to leave it on.
      floodProtectionDelay: 1000, //how often the queue sends out a message.
    },
    steamFormat: { //this is optional, the arguments shown below are defaults;
		false means don't send the message. What messages do we want to tell steam users about?
		The following will be replaced where appropriate:
		$nick $user $host ($nick!$user@$host) $channel $message
		$server (internal server name) $msgprefix $sep (defined above) $by (the person that did the kicking)
		You may want to define this before you initialize your bot, then just pass in the object here.

      sep: ": ", //sep used for formatting
      prefix: "~ ",				//what to prefix all messages on steam with
      kick: "$prefix$nick has kicked from $channel$sep$message by $by",
      join: "$prefix$nick has joined $channel",
      part: "$prefix$nick has left $channel$sep$message",
      quit: "$prefix$nick has quit $channel$sep$message",
      kill: "$prefix$nick has been killed$sep$message",
      msg: "$prefix$nick: $message",
      nick: "$prefix$oldnick is now $newnick",
      notice: false,
      modes: "$prefix$nick has set mode $channel$sep$message", //mode changes in the chat (message is the mode change and the arguments if there are any)
      actions: "$prefix $message"
      privmsg: "$nick!$user@$host PRIVMSG$sep$message", //tell admins when someone privmsgs us (not a channel)
      privNotice: "$nick!$user@$host NOTICE$sep$message", //tell admins when someone notices us (not a channel)?
    },
    ircFormat: { //available is $username, $userid, $bywho, $bywhoid, $prefix, $roomid, $roomname (roomname defaults to steamid64 if you didn't define it above)
      prefix: "~ ",
      msg: "$prefix$username: $message",
      join: "$prefix$username joined $roomname",
      leave: "$prefix$username left $roomname",
      kick: "$prefix$username was kicked from $roomname by $by",
      ban: "$prefix$username was banned from $roomname by $by",
      //the options below haven't been implemented yet, this is why they're commented out.
      //quit: "$prefix$username quit", //not yet implemented
      //discon: "$prefix$username disconnected", //not yet implemented
      //mod: "$bywho has moderated $roomname", //only moderators & officers can talk on steam
      //unmod: "$bywho has unmoderated $roomname",
      //lock: "$bywho has locked $roomname." //only members can join on steam
      //unlock: "$bywho has unlocked $roomname."
    }
  },
  servers: [
    {
      admins: [], //overrides the admins defined above
      name: 'Mibbit',		//name of network.
      nickname: 'SteamRelayBoy',//nickname on this server
      server: 'irc.mibbit.com',	//irc server
      serverPass: 'password',	//password for the irc server
      performs: [		//what commands to perform on connection. These must be *RAW* irc commands, not client commands. That means use PRIVMSG, not /msg
        'PRIVMSG NickServ :login SteamBot thepasswordisherpes' //I'm not adding a regular nickserv authentication, just stick it in commands.
        'KNOCK #ADMIN :Steam-relay is here!',			//According to protocol
	'JOIN #LOG userssuck',					//join #logs using the password 'userssuck'
	'PRIVMSG #LOG :Bot is now connected!'			//According to RFC 1459, message text always gets prefixed with a colon, see section 4.4.1. This is also applied to PART, QUIT, and KNOCK.
      ]
    },
    { //repeat above for another network
      admins: [], //overrides the admins defined in server settings for command usage *ONLY*
      name: 'ZNC',		//it might be useful to use a bouncer.
      server: 'localhost',
      serverPass: 'user:password',
    }
  ],
  relays: [ //You need an entry for each channel that you want to relay.
	You can relay a chat to multiple networks if you like, but you need multiple entries for it, and it will *not* relay from one chat to another.

    {
      server: 'Mibbit', //If you don't set this the same as a network name above, it won't work. Everything is case sensitive.
      channel: '#SteamBots', //same.
      steamchatName: 'Chat Bots Dev & Testing', //name of your steam chat, optional (defaults to the steamid below)
      steamchat: '103582791438731217' //Every time someone else's bot joins our groupchat and spams irc messages at us, we kill a kitten.
    },
    { network: 'Mibbit', channel: '#EndOfTheInternet', steamchat: '103582791433731577'}
  ]
}
*/

var IRCRelay = function() {
	IRCRelay.super_.apply(this, arguments);
};

util.inherits(IRCRelay, BaseTrigger);

var type = "IRCRelay";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	console.log("exports.create");
	var trigger = new IRCRelay(type, name, chatBot, options);
	trigger.repsectsGlobalFilters = false;
	trigger.allowMessageTriggerAfterResponse = true;
	trigger.respectsMute = options.respectsMute || false;
	trigger.options.dbFile = options.hasOwnProperty('dbFile') ? options.dbFile : chatBot.name + '/' + name+".db";
	trigger.options.command = options.command || "!relay";
	trigger.db = (function(){try{return JSON.parse(fs.readFileSync(trigger.options.dbFile));}catch(err){return {}}})();
	return trigger;
}

IRCRelay.prototype._onLoad = function() {
	console.log("onload");
	var that = this;
	that.winston.debug(that.chatBot.name+"/"+that.name+": Loading");
	this.defaults = this._validateLinkOptions(this.options.defaults);
	this.servers = [];
	this.relays = [];
	that.winston.silly(that.chatBot.name+"/"+that.name+': Initializing servers');
	_.each(this.options.servers, function(server){that._createServer(server)});
//	_.each(this.options.relays, function(server){that._configureRelay(server)});
	return true;
}
IRCRelay.prototype._onLoggedOn = function() {
	var that = this;
	setTimeout(function(){
		if(that.chatBot.steamClient.loggedOn) { return; }
		_.each(that.servers, function(server) {
			that._tryCallback(true,function(){
				server.connectfunc();
			});
		});
	},1500);
}
IRCRelay.prototype._onLoggedOff = function() {
	var that = this;
	setTimeout(function(){
		if(that.chatBot.steamClient.loggedOn) { return; }
		_.each(that.servers, function(server) {
			that._tryCallback(true,function(){
				server.disconnect("Disconnected from steam");
			});
		});
	},1500);
}
IRCRelay.prototype._createServer = function(server) {
	var that = this;
	that.winston.debug(that.chatBot.name+"/"+that.name+": Initializing "+server.name);
	try {
		that.winston.silly(server);
		that.winston.debug(that.chatBot.name+"/"+that.name+": Creating irc object for "+server.name);
		if(!server.options)               { server.options = {} }
		if(!server.options.userName)      { server.options.userName = 'steamrelay'; }
		if(!server.options.realName)      { server.options.realName = 'steam-chat-bot steam<->irc relay'; }
		if(server.options.ircBot!==false) { server.options.ircBot=true; }
		if(!server.options.messageSplit)  { server.options.messageSplit = 256; }
		if(!server.options.hasOwnProperty('autoRejoin'))           { server.options.autoRejoin  = true; }
		if(!server.options.hasOwnProperty('stripColors'))          { server.options.stripColors = true; }
		if(!server.options.hasOwnProperty('floodProtection'))      { server.options.floodProtection      = true; }
		if(!server.options.hasOwnProperty('floodProtectionDelay')) { server.options.floodProtectionDelay = 1000; }
		server.options.autoconnect = false;
		server.options.channels = [];
		var relays = [];
		_.each(that.options.relays, function(link) {
			that.winston.debug(that.chatBot.name+"/"+that.name+": link: ",link);
			if(link.server===server.name && link.channel && link.steamchat) {
				server.options.channels.push(link.channel);
				var validOptions = that._validateLinkOptions(link);
				that.relays.push(validOptions);
				relays.push(validOptions);
				that.winston.debug(that.chatBot.name+"/"+that.name+": validlink: ",validOptions);
			}
		});
		var ircServer = new irc.Client(server.server,server.nickname,server.options);
		that.winston.debug(that.chatBot.name+"/"+that.name+": Connecting to "+server.name);
		ircServer.connectfunc = function(){
			if(server.performs && server.performs.length > 0) {
				that.winston.debug(that.chatBot.name+"/"+that.name+": Sending performs for "+server.name);
				if(server.options.ircBot!==false) {
					try {
						ircServer.send('MODE '+ircServer.nick+" +B"); //set the user as a bot.
					} catch(err) {
						that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
					}
				}
				_.each(server.performs, function(line) {
					that.winston.info(that.chatBot.name+"/"+that.name+": Sending command: "+line);
					try {
						ircServer.send(line);
					} catch(err) {
						that.winston.error(that.chatBot.name+"/"+that.name+":",err.stack);
					}
				});
			}
		};
		ircServer.config = server; //we probably don't need this, but whatever
		ircServer.name = server.name;
		ircServer.relays = relays;
		that.winston.silly(that.chatBot.name+"/"+that.name+': Initializing relays for '+server.name);
		that._configureRelays(ircServer);
		that.servers.push(ircServer);
		_.each(that.relays, function(link) {
			if(link.server===server.name && link.channel && link.steamchat) {
				link.ircServer = ircServer;
			}
		});
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name,err.stack);
	}
}
IRCRelay.prototype._validateLinkOptions = function(link) {
	this.winston.debug(this.chatBot.name+"/"+this.name+": Validating relay options for ",link);
	link.steamFormat = link.steamFormat || {};
	if(!link.steamFormat.hasOwnProperty('sep'))	{ link.steamFormat.sep		= ': '; }
	if(!link.steamFormat.hasOwnProperty('prefix'))	{ link.steamFormat.prefix	= '~ '; }
	if(!link.steamFormat.hasOwnProperty('join'))	{ link.steamFormat.join		= '$prefix$nick has joined $channel'; }
	if(!link.steamFormat.hasOwnProperty('part'))	{ link.steamFormat.part		= '$prefix$nick has left $channel$sep$message'; }
	if(!link.steamFormat.hasOwnProperty('quit'))	{ link.steamFormat.quit		= '$prefix$nick has quit $channel$sep$message'; }
	if(!link.steamFormat.hasOwnProperty('msg'))	{ link.steamFormat.msg		= '$prefix$nick: $message'; }
	if(!link.steamFormat.hasOwnProperty('nick'))	{ link.steamFormat.nick		= '$prefix$oldnick is now $newnick'; }
	if(!link.steamFormat.hasOwnProperty('modes'))	{ link.steamFormat.modes	= '$nick has set mode $channel$sep$mode'; }
	if(!link.steamFormat.hasOwnProperty('actions'))	{ link.steamFormat.actions	= '$nick $message'; }
	if(!link.steamFormat.hasOwnProperty('kick'))	{ link.steamFormat.kick		= "$prefix$nick has kicked from $channel by $by$sep$message"; }
	if(!link.steamFormat.hasOwnProperty('kill'))	{ link.steamFormat.kill		= "$prefix$nick has been killed$sep$message"; }
	if(!link.steamFormat.hasOwnProperty('privmsg'))	{ link.steamFormat.privmsg	= "$prefix$nick!$user@$host PRIVMSG$sep$message"; }
	if(!link.steamFormat.hasOwnProperty('privNotice')){link.steamFormat.privNotice	= "$prefix$nick!$user@$host NOTICE$sep$message"; }
	link.ircFormat = link.ircFormat || {};
	if(!link.ircFormat.hasOwnProperty('prefix'))	{ link.ircFormat.prefix	= '~ '; }
	if(!link.ircFormat.hasOwnProperty('msg'))	{ link.ircFormat.msg	= "$prefix$username: $message"; }
	if(!link.ircFormat.hasOwnProperty('join'))	{ link.ircFormat.join	= "$prefix$username joined $roomname"; }
	if(!link.ircFormat.hasOwnProperty('leave'))	{ link.ircFormat.leave	= "$prefix$username left $roomname"; }
	if(!link.ircFormat.hasOwnProperty('kick'))	{ link.ircFormat.kick	= "$prefix$username was kicked from $roomname by $by"; }
	if(!link.ircFormat.hasOwnProperty('ban'))	{ link.ircFormat.ban	= "$prefix$username was banned from $roomname by $by"; }
	if(!link.ircFormat.hasOwnProperty('quit'))	{ link.ircFormat.quit	= "$prefix$username quit"; }
	if(!link.ircFormat.hasOwnProperty('discon'))	{ link.ircFormat.discon	= "$prefix$username disconnected"; }
	if(!link.ircFormat.hasOwnProperty('mod'))	{ link.ircFormat.mod	= "$prefix$bywho has moderated $roomname"; }
	if(!link.ircFormat.hasOwnProperty('unmod'))	{ link.ircFormat.unmod	= "$prefix$bywho has unmoderated $roomname"; }
	if(!link.ircFormat.hasOwnProperty('lock'))	{ link.ircFormat.lock	= "$prefix$bywho has locked $roomname."; }
	if(!link.ircFormat.hasOwnProperty('unlock'))	{ link.ircFormat.unlock	= "$prefix$bywho has unlocked $roomname."; }
	return link;
}

IRCRelay.prototype._configureRelays = function(server) {
	this.winston.debug(this.chatBot.name+"/"+this.name+": Configuring Relay",server.name);
	var that = this;
	server.addListener('message#', function(nick, to, text, message) {
		that.winston.silly(that.chatBot.name+"/"+that.name+": message: ",message);
		that.winston.silly(that.chatBot.name+"/"+that.name+": server: ",server);
		_.each(server.relays, function(link) { that._tryCallback(function(){
				if(to.toLowerCase()===link.channel.toLowerCase() && nick !== link.ircServer.nick) {
					var msg = that._formatMessageForSteam({nick:nick,chan:to,text:text,message:message,format:link.steamFormat.msg,link:link});
					that.winston.log(that.chatBot.name+"/"+that.name,msg);
					if(msg) {
						that._delayedMessage(link.steamchat,msg);
					}
				}
		});	});
	});
	server.addListener('notice', function(nick, to, text, message) {
		var sent = false;
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(to.toLowerCase()===link.channel.toLowerCase() && nick !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:nick,chan:to,text:text,message:message,format:link.steamFormat.notice,link:link});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
				if(msg) { sent=true };
			}
		}); });
		var admins = server.admins || that.admins || false;
		if(sent) {
			return true;
		} else if(!admins || admins.length<1) {
			return false;
		}
		_.each(admins, function(admin) { that._tryCallback(function(){
			if(nick !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:nick,text:text,format:link.steamFormat.privNotice,link:link,message:message});
				if(msg) { that._delayedMessage(admin,msg); }
			}
		}); });
	});
	server.addListener('kick', function(channel, nick, by, reason, message) {
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(channel.toLowerCase()===link.channel.toLowerCase() && nick !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:nick,chan:channel,text:reason,message:message,format:link.steamFormat.kick,link:link,by:by});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
			}
		}); });
	});
	server.addListener('part', function(channel, nick, reason, message) {
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(channel.toLowerCase()===link.channel.toLowerCase() && nick !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:nick,chan:channel,text:reason,message:message,format:link.steamFormat.part,link:link});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
			}
		}); });
	});
	server.addListener('quit', function(nick,reason,channels,message) {
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(channels.indexOf(link.channel) > -1 && nick !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:nick,chan:link.channel,text:reason,message:message,format:link.steamFormat.quit,link:link});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
			}
		}); });
	});
	server.addListener('kill', function(nick,reason,channels,message) {
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(channels.indexOf(link.channel) > -1 && nick !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:nick,chan:link.channel,text:reason,message:message,format:link.steamFormat.kill,link:link});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
			}
		}); });
	});
	server.addListener('nick', function(oldnick,newnick,channels,message) {
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(channels.indexOf(link.channel) > -1) {
				var msg = that._formatMessageForSteam({oldnick:oldnick,newnick:newnick,chan:link.channel,format:link.steamFormat.nick,link:link,message:message});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
			}
		}); });
	});
	server.addListener('join', function(channel, nick, message) {
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(channel.toLowerCase()===link.channel.toLowerCase() && nick !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:nick,chan:channel,format:link.steamFormat.join,link:link,message:message});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
			}
		}); });
	});
	server.addListener('+mode', function(channel, by, mode, argument, message) {
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(channel.toLowerCase()===link.channel.toLowerCase() && by !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:by,chan:channel,text:"+"+mode+" "+(argument||""),format:link.steamFormat.modes,link:link,message:message});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
			}
		}); });
	});
	server.addListener('-mode', function(channel, by, mode, argument, message) {
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(channel.toLowerCase()===link.channel.toLowerCase() && by !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:by,chan:channel,text:"-"+mode+" "+(argument||""),format:link.steamFormat.modes,link:link,message:message});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
			}
		}); });
	});
	server.addListener('action', function(from, to, text, message) {
		_.each(server.relays, function(link) { that._tryCallback(function(){
			if(to.toLowerCase()===link.channel.toLowerCase() && from !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({nick:from,chan:to,text:text,format:link.steamFormat.actions,link:link,message:message});
				if(msg) { that._delayedMessage(link.steamchat,msg); }
			}
		}); });
	});
	server.addListener('pm', function(from, to, text, message) {
		var admins = server.admins || that.admins || false;
		if(!admins || admins.length<1) {
			return false;
		}
		_.each(admins, function(admin) { that._tryCallback(function(){
			if(to.toLowerCase()===link.channel.toLowerCase() && from !== link.ircServer.nick) {
				var msg = that._formatMessageForSteam({from:from,text:text,format:link.steamFormat.privmsg,link:link,message:message});
				if(msg) { that._delayedMessage(admin,msg); }
			}
		}); });
	});
	server.addListener('error', function(error) {
		var admins = server.admins || that.admins || false;
		_.each(admins, function(admin) { that._tryCallback(function(){
			that._delayedMessage(admin,JSON.stringify(error));
		}); });
		that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",error);
	});
	return true;
//	} catch(err) {
//		that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
//	}
}
IRCRelay.prototype._tryCallback = function(always,callback) {
	var that = this;
	if(always instanceof Function) {
		callback = always;
		always = false;
	}
	if(this.chatBot.steamClient.loggedOn || always) {
		try {
			callback();
		} catch(err) {
			that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
		}
	}
}
IRCRelay.prototype._formatMessageForSteam = function(obj) {
	if(obj.format===false) { return false; }
	var msg = obj.format.split('$nick').join(obj.nick);
	msg = msg.split('$mode').join(obj.text);
	msg = msg.split('$user').join(obj.message.user);
	msg = msg.split('$host').join(obj.message.host);
	if(obj.chan) { msg = msg.split('$channel').join(obj.chan); }
	msg = msg.split('$server').join(obj.link.server);
	msg = msg.split('$prefix').join(obj.link.steamFormat.prefix);
	if(obj.by) { msg = msg.split('$by').join(obj.by); }
	if(obj.text && obj.text.length >0) { msg = msg.split('$sep').join(obj.link.steamFormat.sep);}
	else { msg = msg.split('$sep').join(''); }
	if(obj.oldnick) { msg = msg.split('$oldnick').join(obj.oldnick); }
	if(obj.newnick) { msg = msg.split('$newnick').join(obj.newnick); }
	if(obj.text) { msg = msg.split('$message').join(obj.text); }
	return msg;
}

IRCRelay.prototype._respondToFriendMessage = function(userId, message) {
	var command;
	if(message.indexOf(this.options.command)===0 && userId in this.admins) {
		command = message.substr(this.options.command.length+1);
	} else {
		return false;
	}

	this._processCommand('steam',null,userId,command);
	if(sent && this.options.debug) { return true; }
	return false;
}

IRCRelay.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	var that = this;
//	var command;
//	if(message.indexOf(this.options.command)===0 && userId in this.admins) {
//		command = message.substr(this.options.command.length+1);
//		this._processCommand('steam',null,userId,command);
//	}

	var sent = false;
	that.winston.silly(that.chatBot.name+"/"+that.name,message);
	_.each(this.relays, function(link) {
		that.winston.silly(that.chatBot.name+"/"+that.name,link.ircServer.name);
		if(that.options.debug) { that.winston.silly(link); }
		if(link.steamchat===roomId) {
			var msg = that._formatMessageForIRC({user:chatterId,message:message,link:link,format:link.ircFormat.msg});
			if(msg) {
				that.winston.silly(that.chatBot.name+"/"+that.name+": "+msg);
				sent = that._trySay(link,link.channel,msg);
			}
		}
	});
	if(sent && this.options.debug) { return true; }
	return false;
}

IRCRelay.prototype._respondToSentMessage = function(toId, message) {
	//Don't repeat messages that *this* plugin sent on steam.
	if(this.lastMessage === message) {
		this.lastMessage = false; //we still want to send repeated messages, after all.
		return false;
	}
	var that = this;
	var sent = false;
	_.each(this.relays, function(link) {
		if(that.options.debug) { that.winston.silly(that.chatBot.name+"/"+that.name,link); }
		if(toId===link.steamchat) {
			var msg = that._formatMessageForIRC({user:that.chatBot.steamClient.steamID,message:message,link:link,format:link.ircFormat.msg});
			if(msg) {
				sent = that._trySay(link,link.channel,msg);
			}
		}
	});
	if(sent && this.options.debug) { return true; }
	return false;
}

IRCRelay.prototype._respondToEnteredMessage = function(roomId,userId) {
	var that = this;
	var sent = false;
	_.each(this.relays, function(link) {
		if(that.options.debug) { that.winston.silly(that.chatBot.name+"/"+that.name,link); }
		if(roomId===link.steamchat) {
			var msg = that._formatMessageForIRC({user:userId,link:link,format:link.ircFormat.join});
			if(msg) {
				sent = that._trySay(link,link.channel,msg);
			}
		}
	});
	if(sent && this.options.debug) { return true; }
	return false;
}
IRCRelay.prototype._respondToLeftMessage = function(roomId, userId) {
	var that = this;
	var sent = false;
	_.each(this.relays, function(link) {
		if(that.options.debug) { that.winston.silly(that.chatBot.name+"/"+that.name,link); }
		if(roomId===link.steamchat) {
			var msg = that._formatMessageForIRC({user:userId,link:link,format:link.ircFormat.leave});
			if(msg) {
				sent = that._trySay(link,link.channel,msg);
			}
		}
	});
	if(sent && this.options.debug) { return true; }
	return false;
}

IRCRelay.prototype._respondToKick = function(roomId,kickedId,kickerId) {
	var that = this;
	var sent = false;
	_.each(this.relays, function(link) {
		if(that.options.debug) { that.winston.silly(that.chatBot.name+"/"+that.name,link); }
		if(roomId===link.steamchat) {
			var msg = that._formatMessageForIRC({user:bannedId,who:bannerId,roomId:roomId,link:link,format:link.ircFormat.kick});
			if(msg) {
				sent = that._trySay(link,link.channel,msg);
			}
		}
	});
	if(sent && this.options.debug) { return true; }
	return false;
}
IRCRelay.prototype._respondToBan = function(roomId,bannedId,bannerId) {
	var that = this;
	var sent = false;
	_.each(this.relays, function(link) {
		if(that.options.debug) { that.winston.silly(that.chatBot.name+"/"+that.name,link); }
		if(roomId===link.steamchat) {
			var msg = that._formatMessageForIRC({user:bannedId,who:bannerId,roomId:roomId,link:link,format:link.ircFormat.ban});
			if(msg) {
				sent = that._trySay(link,link.channel,msg);
			}
		}
	});
	if(sent && this.options.debug) { return true; }
	return false;
}
//        quit: "$prefix$username quit", //not yet implemented
//        disconnected: "$prefix$username disconnected", //not yet implemented
//        moderated: "$bywho has moderated $roomname", //only moderators & officers can talk on steam
//        unmoderated: "$bywho has unmoderated $roomname",
//        locked: "$bywho has locked $roomname." //only members can join on steam
//        unlocked: "$bywho has unlocked $roomname."

IRCRelay.prototype._trySay = function(link,channel,message) {
	var that = this;
	try {
		link.ircServer.say(channel, message);
		return true;
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
		return false;
	}
}
// Return true if the event was eaten
IRCRelay.prototype._formatMessageForIRC = function(obj) {
	var that = this;
	if(obj.format===false) { return false; }
	var msg = obj.format;
	msg = msg.split('$prefix').join(obj.link.ircFormat.prefix);
	if(obj.user) {
		msg = msg.split('$username').join(that._username(obj.user));
		msg = msg.split('$userid').join(obj.user);
	}
	if(obj.who) {
		msg = msg.split('$bywhoid').join(obj.who);
		msg = msg.split('$whoid').join(obj.who);
		msg = msg.split('$bywho').join(that._username(obj.who));
		msg = msg.split('$by').join(that._username(obj.who));
		msg = msg.split('$who').join(that._username(obj.who));
	}
	msg = msg.split('$roomname').join(obj.link.steamchatName);
	msg = msg.split('$roomid').join(obj.link.steamchat);
	if(obj.message) { msg = msg.split('$message').join(obj.message); }
	return msg;
}

// Return true if the event was eaten
IRCRelay.prototype._respondToDisconnect = function(roomId,userId) {
	return false;
}

// Return true if the event was eaten
IRCRelay.prototype._username = function(steamId) {
	return ((this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates) ? this.chatBot.steamFriends.personaStates[steamId].player_name : steamId)
}
IRCRelay.prototype._tryEach = function(stuff,func) {
	var that = this;
	_.each(stuff, function(thing) {
		try{
			func(thing);
		} catch(err) {
			that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
		}
	});
}
IRCRelay.prototype._processCommand = function(origin, unknown, user, command) {
	return false;
}
IRCRelay.prototype._delayedMessage = function(to, msg) {
	this.lastMessage = msg; //keep track of the last message we sent, so we can avoid sending it to irc.
	this._sendMessageAfterDelay(to, msg);
}
