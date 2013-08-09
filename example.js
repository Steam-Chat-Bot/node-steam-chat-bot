var ChatBot = require('steam-chat-bot').ChatBot;

// This will log in a steam user with the specified username and password 
// You can also pass in a steam guard code from an email
var myBot = new ChatBot('username', 'password', {
//	sentryFile: '',		//Bot tries to find a sentry file automatically. This is only required if you have one with a strange name, otherwise it's automatic.
//	guardCode: '',		//guardCode will override a sentry file. Comment this out after the first use.
//	games: [440],		//this is a comma-separated array of games that the bot will play automatically on login. 440 is tf2.
	autoReconnect: true	//automatically reconnect to the server
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
		name: 'BadRatsCommand', 
		type: 'BotCommandTrigger', 
		options: { 
			matches: ['bat rats'], 
			exact: false,
			callback: function(bot) { bot.joinGame(34900); }
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
			timeout: 10*1000 
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
			timeout: 60*60*1000 } },
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
/*	you probably don't have :D: or :medicon: emotes on your bot, so this is commented out.
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
*/	{ 
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

	// Query Wolfram Alpha when a message starts with !wolfram
	{ 
		name: 'WolframReply', 
		type: 'WolframAlphaTrigger', 
		options: { command: '!wolfram', appId: 'XXXXXX' } 
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
