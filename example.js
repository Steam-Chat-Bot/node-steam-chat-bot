<<<<<<< HEAD
var ChatBot = require('steam-chat-bot').ChatBot;

// This will log in a steam user with the specified username and password 
// You can also pass in a steam guard code from an email
var myBot = new ChatBot('username', 'password', {
//	sentryFile: '',		//Bot tries to find a sentry file automatically. This is only required if you have one with a strange name, otherwise it's automatic.
//	guardCode: '',		//guardCode will override a sentry file. Comment this out after the first use.
	logFile: true,		//set to true to log to bot.$username.log, or define a custom logfile. Set to false if you don't want to log to file.
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

//these are useful for displaying your bot as playing a game, so it shows up in the upper part of the userlist.
//this is a comma-separated array of games that the bot will play automatically on login. 440 is tf2.
//myBot.setGames([440]);
//this will stop all games, start the game listed (the first parameter), then after a delay in ms (the second param), start any games it was already playing. 570 is dota2.
//myBot.setPrimaryGame(570,250);
=======
function $(arg){ return arg; }

var ChatBot = require('steam-chat-bot').ChatBot;
var BotCommands = require('steam-chat-bot').BotCommands;

console.log(1);
// This will log in a steam user with the specified username and password
var myBot = new ChatBot('username', 'password', {
	logFile: true,		//set to true to log to bot.$username.log, or define a custom logfile. Set to false if you don't want to log to file.
	autoReconnect: true,	//automatically reconnect to the server
//	autojoinFile: 'bot.autojoins', //if defined, will override 'bot.username.autojoins'.
	babysitTimer: 5*60*1000
});

//you can make variables and reference them later so you don't have to look at steamid64s below.
var admin = 'yoursteamid64'; //so far this is only used for the 'hi bot' trigger that responds with 'hi master'
// var ignoredUserForSometrigger = 'steamid64';
// sometrigger { options { ignore: [ignoredUserForSometrigger] }},
// var channels = { 'room1' : 'steamid64', 'room2' : 'steamid64', 'room3' : 'steamid64' };
// sometrigger { options { ignore: [channels.room1] }},
// sometrigger { options { rooms: [channels.room1, channels.room3] }},


// Set up the triggers to control the bot
//All triggers support the following options
	//ignore: [], - an array of users to ignore, and channels not to respond in.
	//user: [], - an array of users that are allowed to use this trigger. If someone else tries, they will be ignored (if defined).
	//rooms: [], - an array of rooms that are allowed to use this trigger. It won't work in other rooms if defined.

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
			chatrooms: {
				'GroupSteamId': 'Welcome message',
				'GroupSteamId2': 'Welcome message2'},
			autoJoinAfterDisconnect: true }
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
			probability: 0.4, 
			timeout: 30*1000 
		} 
	},
	{ 
		name: 'PingReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['ping'], 
			responses: ['pong'], 
			exact: true, 
			delay: 1000, 
			probability: 1, 
			timeout: 30*1000 ,
//			ignore: [ignoredUserForSomeTrigger, seriousChannel1, seriousChannel2]
		} 
	},
	/* You probably don't have these emoticons...
	{ 
		name: 'HealReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['heal','health','heal me',"i'm hurt","I'm hurt",'im hurt','Im hurt'], 
			responses: [':medicon:',':health:'], 
			delay: 1000, 
			probability: 1, 
			timeout: 2*60*60*1000 
		} 
	}, */
	{ 
		name: 'HeartReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['<3'], 
			responses: ['</3', '<3'], 
			delay: 500, 
			probability: 0.5, 
			timeout: 10*60*1000 } },
	{ 
		name: 'SmileReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['☺',':)'], 
			responses: ['☹'],
			delay: 500, 
			probability: 0.5, 
			timeout: 30*60*1000 } },
	{ 
		name: 'FrownReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['☹',':('], 
			responses: ['☺'],
			delay: 500, 
			probability: 0.5, 
			timeout: 30*60*1000 } },
	{ 
		name: 'GrinReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: [':D','ːDː'], 
			responses: [':D:'], 
			delay: 500, 
			probability: 0.5, 
			timeout: 60*1000 } },
	{ 
		name: 'NameReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['Bot'], 
			responses: ['That\s my name!'], 
			exact: true, 
			delay: 500, 
			probability: 0.5, 
			timeout: 60*60*1000 } },
	//respond to !8ball. This should probably be a command, not a match, but whatever.
	{ 
		name: 'EightBall', 
		type: 'ChatReplyTrigger', 
		options: {
			matches: ['!8ball'],
			responses: ['It is certain','It is decidedly so','Without a doubt','Yes, definitely','You may rely on it','As I see it, yes','Most likely','Outlook good','Yes','Signs point to yes','Reply hazy, try again','Ask again later','Better not tell you now','Cannot predict now','Concentrate and ask again',"Don't count on it",'My sources say no','Outlook not so good','Very doubtful'],
			timeout: 2*1000,
			delay: 500
		} 
	},
	//check steamrep on command. this plugin does *not* respect mute.
	{ 
		name: 'SteamIDCheck', 
		type: 'SteamInfoTrigger', 
		options: { 
			command: "!steamrep", 
			delay: 2000, 
			timeout: 5*1000 
		} 
	},
	//check steamrep on join. If you set an option for whoToTell, it will PM scammer alerts to them, rather than posting them in the channel. This plugin does *not* respect mute. It will post even if the bot is muted!
	{
		name: 'SteamrepOnJoin',
		type: 'SteamrepOnJoinTrigger'
	},

	// Reply triggers that will only respond to a particular user
	{ 
		name: 'SingleUserReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['hi bot'], 
			responses: ['hi boss!','hi master!'], 
			exact: true, 
			user: [admin]
		} 
	},
	{ 
		name: 'RollDice', 
		type: 'RollTrigger', 
		options: { 
			command: '!roll', 
			delay: 500,
			timeout: 1000
		} 
	},
	// Sample regex trigger, "mate" will be responded to with "mmaaaate", 
	// "mmaaaate" will be responded to with "mmmaaaaaaate", etc
	{ 
		name: 'MateEscalation', 
		type: 'RegexReplaceTrigger',
		options: {
			match: /^(m+?)(a+?)te(s??)$/,
			response: '{0}m{1}aaate{2}',
			delay: 500,
		} 
	},

	// Butt bot, replace a random word from someone's message with "butt" about once every 50 messages
	{ 
		name: 'ButtBot', 
		type: 'ButtBotTrigger', 
		options: {
			replacement: 'butt',
			probability: 0.01,
			delay: 1000,
			timeout: 2*60*60*1000,
		} 
	},
	//laugh when people say butt
	{ 
		name: 'ButtReply', 
		type: 'ChatReplyTrigger', 
		options: {
			matches: ['butt'],
			responses: ['lol, you said butt'],
			probability: 0.9,
			timeout: 2*60*60*1000,
			delay: 500,
		} 
	},
	//comment when people mention porn
	{ 
		name: 'PornReply', 
		type: 'ChatReplyTrigger', 
		options: {
			matches: ['porn'],
			responses: ['I like porn! :D:','69!'],
			probability: 0.9,
			timeout: 2*60*60*1000,
			delay: 500,
		} 
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
			probability: 0.05, 
			timeout: 60*60*1000,
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
		options: { probability: 0.75, timeout: 2000 } 
	},

	// Say something when a user joins chat
	{ 
		name: 'AdminEnter', 
		type: 'MessageOnJoinTrigger', 
		options: { 
			user: admin,
			message: "Hello, sexy :D:", 
			probability: 1, 
			timeout: 15*60*1000, 
			delay: 5*60*1000
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
		options: {
			command: '!yt',
			rickrollChance: .05
		} 
	},
]);
myBot.connect();

// Trigger details can be retrieved and reloaded so that external configuration can be supported
var details = myBot.getTriggerDetails();
myBot.clearTriggers();
myBot.addTriggers(details);

//these are useful for displaying your bot as playing a game, so it shows up in the upper part of the userlist.
//this is a comma-separated array of games that the bot will play automatically on login. 440 is tf2.
//myBot.setGames([440]);
//this will stop all games, start the game listed (the first parameter), then after a delay in ms (the second param), start any games it was already playing. 570 is dota2.
//myBot.setPrimaryGame(570,250);
>>>>>>> 5856d8ae2b37216db368ff2ab5137d630b4ff2c2
