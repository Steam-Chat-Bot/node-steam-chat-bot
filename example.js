var ChatBot = require('./lib/chatBot.js').ChatBot;

var BotCommandTrigger = require('./lib/triggers/botCommandTrigger.js');

// This will log in a steam user with the specified username and password
var myBot = new ChatBot('username', 'password');

// Set up the triggers to control the bot
myBot.addTriggers([
	// Commands to stop the bot from saying anything in a chatroom
	{ name: 'MuteCommand', type: 'BotCommandTrigger', options: { matches: ['!mute', '!pause'], command: BotCommandTrigger.Commands.Mute } },
	{ name: 'UnmuteCommand', type: 'BotCommandTrigger', options: { matches: ['!unmute', '!unpause'], command: BotCommandTrigger.Commands.Unmute } },

	// Automatically accept invites from any user to the specified group chat
	{ name: 'AcceptChatInvite', type: 'AcceptChatInviteTrigger', options: { chatrooms: { 'GroupSteamId': 'Welcome message' } } },

	// Automatically accept all friend requests
	{ name: 'AcceptFriendRequest', type: 'AcceptFriendRequestTrigger' },

	// Reply triggers - respond to a chat/private message if it matches a set of inputs (case-insensitive exact or substring match), and choose randomly from a set of responses
	{ name: 'EmptyQuoteReply', type: 'ChatReplyTrigger', options: { matches: ['^'], responses: ['^'], exact: true, delay: 1000, probability: 0.2, timeout: 10*1000 } },
	{ name: 'HeartReply', type: 'ChatReplyTrigger', options: { matches: ['<3'], responses: ['</3', '<3'], exact: true, delay: 500, probability: 0.5, timeout: 60*60*1000 } },
	{ name: 'SteveHoltReply', type: 'ChatReplyTrigger', options: { matches: ['steve holt', 'steve holt!'], responses: ['\\o/'], exact: false, delay: 500, timeout: 10*1000 } },

	// Reply triggers that will only respond to a particular user
	{ name: 'SingleUserReply', type: 'ChatReplyTrigger', options: { matches: ['hi bot'], responses: ['hi boss!'], exact: true, users: ['76561197961244239'] } },

	// Sample regex trigger, "mate" will be responded to with "mmaaaate", "mmaaaate" will be responded to with "mmmaaaaaaate", etc
	{ name: 'MateEscalation', type: 'RegexReplaceTrigger', options: { match: /^(m+?)(a+?)te(s??)$/, response: '{0}m{1}aaate{2}', delay: 500} },

	// Butt bot, replace a random word from someone's message with "butt" about once every 50 messages
	{ name: 'ButtBot', type: 'ButtBotTrigger', options: { replacement: 'butt', probability: 0.02, delay: 1000 } },

	// Chat reply that doesn't need a particular message to trigger, just a random reply about once every 100 messages (and no more than once an hour)
	{ name: 'RandomReply', type: 'ChatReplyTrigger', options: { matches: [], responses: ['ლ(ಠ益ಠლ)', 'щ(ﾟДﾟщ)', 'omg', '(ﾉಥ益ಥ)ﾉ', '¯\\_(ツ)_/¯'], delay: 500, probability: 0.01, timeout: 60*60*1000 } },

	// Cleverbot reply that only happens when the word "cleverbot" is mentioned
	{ name: 'DirectCleverbotReply', type: 'CleverbotTrigger', options: { keywords: ['cleverbot'] } },

	// Random cleverbot reply that triggers randomly about once every 100 messages
	{ name: 'RandomCleverbotReply', type: 'CleverbotTrigger', options: { probability: 0.01, timeout: 30*60*1000 } },

	// Say something when a user joins chat
	{ name: 'SteveHoltEnter', type: 'MessageOnJoinTrigger', options: { user: '76561197961244239', message: "STEVE HOLT! \\o/", probability: 0.5, delay: 1000, timeout: 24*60*60*1000 } },

	// Query Wolfram Alpha when a message starts with !wolfram
	{ name: 'WolframReply', type: 'WolframAlphaTrigger', options: { command: '!wolfram', appId: 'XXXXXX' } },

	// Post all links from chat to tumblr, and also post things on command
	{ name: 'TumblrTrigger', type: 'TumblrTrigger', options: { blogName: 'XXX', consumerKey: 'XXX', consumerSecret: 'XXX', token: 'XXX', tokenSecret: 'XXX' }  },
]);

// Trigger details can be retrieved and reloaded so that external configuration can be supported
var details = myBot.getTriggerDetails();
myBot.clearTriggers();
myBot.addTriggers(details);