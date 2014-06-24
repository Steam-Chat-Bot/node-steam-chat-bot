<<<<<<< HEAD
var ChatBot = require('steam-chat-bot').ChatBot;

// This will log in a steam user with the specified username and password 
// You can also pass in a steam guard code from an email
var myBot = new ChatBot('username', 'password', {
	logFile: true,				//set to true to log to bot.$username.log, or define a custom logfile. Set to false if you don't want to log to file.
	autoReconnect: true,			//automatically reconnect to the server
//	autojoinFile: 'bot.username.autojoin',	//this is the file where autojoin channels are defined.
	babysitTimer: 300000,			//This is how often the bot will try to reconnect. 300000 is 5 minutes. You probably want 5-30 seconds instead.
	guardCode: "7DDK8",			//You need to get a guardCode from the steamguard email. Unfortunately, we can't import steamguard from the existing steam install.
//	sentryFile: 'bot.username.sentry'	//This is the default sentryFile. If not defined, the bot will search for several possible sentry files then create this file.
});

// Set up the triggers to control the bot
myBot.addTriggers([

	// Commands to stop/unstop the bot from saying anything in a chatroom
	{ 
		name: 'MuteCommand', 
		type: 'BotCommandTrigger', 
		options: { 
			matches: ['!mute', '!pause'], 
			exact: true,
			callback: function(bot) { bot.mute(); }
		} 
	},
	{ 
		name: 'UnmuteCommand', 
		type: 'BotCommandTrigger', 
		options: { 
			matches: ['!unmute', '!unpause'], 
			exact: true,
			callback: function(bot) { bot.unmute(); }
		} 
	},

	// Command to join Bad Rats whenever it's mentioned	
	{ 
		name: 'TF2Command', 
		type: 'BotCommandTrigger', 
		options: { 
			matches: ['team fortress 2'], 
			exact: false,
			callback: function(bot) { bot.joinGame(440); }
		} 
	},

	// Automatically accept invites from any user to the specified group chat
	{ 
		name: 'AcceptChatInvite', 
		type: 'AcceptChatInviteTrigger', 
		options: { 
			chatrooms: { 'GroupSteamId': 'Welcome message' }, 
			autoJoinAfterDisconnect: true
		} 
	},

	// Automatically accept all friend requests
	{ name: 'AcceptFriendRequest', type: 'AcceptFriendRequestTrigger' },

	// Reply triggers - respond to a chat/private message if it matches a set of inputs 
	// (case-insensitive exact or substring match), and choose randomly from a set of responses
	{ 
		name: 'EmptyQuoteReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['^'], 
			responses: ['^'], 
			exact: true, 
			delay: 1000, 
			probability: 0.2, 
			timeout: 10*1000,
			ignore: ['103582791432805705','76561198084722566']  //don't respond to this command in the steam workshop chat, and don't respond to /id/groupchatbot.
		} 
	},
	{ 
		name: 'HeartReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['<3'], 
			responses: ['</3', '<3'], 
			exact: true, 
			delay: 500, 
			probability: 0.5, 
			timeout: 60*60*1000,
			rooms: ['103582791432805705'] } },  //only do this trigger in the steam workshop chat
	{ 
		name: 'PingReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['ping'], 
			responses: ['pong'], 
			exact: true, 
			delay: 1000, 
			probability: 1, 
			timeout: 10*1000 } },
	{ 
		name: 'HealReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['heal','health','heal me',"i'm hurt","I'm hurt",'im hurt','Im hurt'], 
			responses: [':medicon:'], 
			exact: true, 
			delay: 1000, 
			probability: 1, 
			timeout: 10*1000 } },
		name: 'GrinReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: [':D'], 
			responses: [':D:'], 
			exact: true, 
			delay: 500, 
			probability: 0.5, 
			timeout: 60*1000 } },
	{ 
		name: 'SteveHoltReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['steve holt', 'steve holt!'], 
			responses: ['\\o/'], 
			exact: false, 
			delay: 500, 
			timeout: 10*1000 
		} 
	},

		name: 'SteamIDCheck', 
		type: 'SteamInfoTrigger', 
		options: { 
			command: "!steamrep", 
			delay: 2000, 
			timeout: 5000 
		} 
	},
	// Reply triggers that will only respond to a particular user
	{ 
		name: 'SingleUserReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['hi bot'], 
			responses: ['hi boss!'], 
			exact: true, 
			users: ['76561197961244239'] 
		} 
	},

	// Sample regex trigger, "mate" will be responded to with "mmaaaate", 
	// "mmaaaate" will be responded to with "mmmaaaaaaate", etc
	{ 
		name: 'MateEscalation', 
		type: 'RegexReplaceTrigger',
		options: { match: /^(m+?)(a+?)te(s??)$/, response: '{0}m{1}aaate{2}', delay: 500} 
	},

	// Butt bot, replace a random word from someone's message with "butt" about once every 50 messages
	{ 
		name: 'ButtBot', 
		type: 'ButtBotTrigger', 
		options: { replacement: 'butt', probability: 0.02, delay: 1000 } 
	},

	// Chat reply that doesn't need a particular message to trigger, just a random reply about 
	// once every 100 messages (and no more than once an hour)
	{ 
		name: 'RandomReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: [], 
			responses: ['ლ(ಠ益ಠლ)', 'щ(ﾟДﾟщ)', 'omg', '(ﾉಥ益ಥ)ﾉ', '¯\\_(ツ)_/¯'], 
			delay: 500, 
			probability: 0.01, 
			timeout: 60*60*1000 
		} 
	},

	// Cleverbot reply that only happens when the word "cleverbot" is mentioned
	{ 
		name: 'DirectCleverbotReply', 
		type: 'CleverbotTrigger', 
		options: { keywords: ['cleverbot'] } 
	},

	// Random cleverbot reply that triggers randomly about once every 100 messages
	{ 
		name: 'RandomCleverbotReply', 
		type: 'CleverbotTrigger', 
		options: { probability: 0.01, timeout: 30*60*1000 } 
	},

	// Say something when a user joins chat
	{ 
		name: 'SteveHoltEnter', 
		type: 'MessageOnJoinTrigger', 
		options: { 
			user: '76561197961244239', 
			message: "STEVE HOLT! \\o/", 
			probability: 0.5, 
			delay: 1000, 
			timeout: 24*60*60*1000 
		} 
	},
	//roll those dice!
	{ 
		name: 'RollDice', 
		type: 'RollTrigger', 
		options: { 
			command: '!dice', 
			delay: 500,
			timeout: 1000
		} 
	},

	// Query Wolfram Alpha when a message starts with !wolfram
	{ 
		name: 'WolframReply', 
		type: 'WolframAlphaTrigger', 
		options: { command: '!wolfram', appId: 'XXXXXX' } 
	},

	//Query Urban Dictionary using their *unofficial* api when a message starts with !urban
	{ 
		name: 'WolframReply', 
		type: 'UrbanDictionaryTrigger', 
		options: { command: '!urban' } 
	},

	// Post all links from chat to tumblr, and also post things on command
	{ 
		name: 'TumblrTrigger', 
		type: 'TumblrTrigger', 
		options: { 
			autoPost: true, 
			autoPostContext: false, 
			blogName: 'XXX', 
			consumerKey: 'XXX', 
			consumerSecret: 'XXX', 
			token: 'XXX', 
//			ignore: ['103582791432805705','76561198084722566'],   //don't post stuff from the steam workshop chat, and don't post stuff from /id/groupchatbot.
//			rooms: ['103582791432805705'],                        //only post stuff from the steam workshop chat
//			users: ['76561198084722566'],                         //only post stuff from /id/groupchatbot
			tokenSecret: 'XXX' 
		}  
	},

	// Search YouTube and respond with the top result whenever someone types !yt <query>, rickroll about 1 every 100 times
	{ 
		name: 'Youtube', 
		type: 'YoutubeTrigger', 
		options: { command: '!yt', rickrollChance: 0.01 } 
	},
]);

myBot.connect();

// Trigger details can be retrieved and reloaded so that external configuration can be supported
var details = myBot.getTriggerDetails();
myBot.clearTriggers();
myBot.addTriggers(details);
