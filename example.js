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

	// Sample regex trigger, "mate" will be responded to with "mmaaaate", "mmaaaate" will be responded to with "mmmaaaaaaate", etc
	{ name: 'MateEscalation', type: 'RegexReplaceTrigger', options: { match: /^(m+?)(a+?)te(s??)$/, response: '{0}m{1}aaate{2}', delay: 500} },

	// Butt bot, replace a random word from someone's message with "butt" about once every 50 messages
	{ name: 'ButtBot', type: 'ButtBotTrigger', options: { replacement: 'butt', probability: 0.02, delay: 1000 } },

	// Chat reply that doesn't need a particular message to trigger, just a random reply about once every 100 messages (and no more than once an hour)
	{ name: 'RandomReply', type: 'ChatReplyTrigger', options: { matches: [], responses: ['ლ(ಠ益ಠლ)', 'щ(ﾟДﾟщ)', 'omg', '(ﾉಥ益ಥ)ﾉ', '¯\\_(ツ)_/¯'], delay: 500, probability: 0.01, timeout: 60*60*1000 } }
]);