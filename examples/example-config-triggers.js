// this file contains example trigger config/definitions and is meant to be required and passed into ChatBot.addTriggers()

module.exports = [

	// Commands to stop/unstop the bot from saying anything in a chatroom
	{
		name: "MuteCommand",
		type: "BotCommandTrigger",
		options: {
			matches: ["!mute","!pause"],
			exact: true,
			callback: ["mute"] // calls ChatBot.mute()
		}
	},
	{
		name: "UnmuteCommand",
		type: "BotCommandTrigger",
		options: {
			matches: ["!unmute","!unpause"],
			exact: true,
			callback: ["unmute"] // calls ChatBot.unmute()
		}
	},

	// Command to join Bad Rats whenever it's mentioned
	{
		name: "BadRatsCommand",
		type: "BotCommandTrigger",
		options: {
			matches: ["bat rats"],
			exact: false,
			callback: ["joinGame",34900] // calls ChatBot.joinGame(34900)
		}
	},

	// Automatically accept invites from any user to the specified group chat
	{
		name: "AcceptChatInvite",
		type: "AcceptChatInviteTrigger",
		options: {
			chatrooms: {"GroupSteamId": "Welcome message" },
			autoJoinAfterDisconnect: true
		}
	},

	// Automatically accept all friend requests
	{ name: "AcceptFriendRequest",type: "AcceptFriendRequestTrigger" },

	// Reply triggers - respond to a chat/private message if it matches a set of inputs
	// (case-insensitive exact or substring match),and choose randomly from a set of responses
	{
		name: "EmptyQuoteReply",
		type: "ChatReplyTrigger",
		options: {
			matches: ["^"],
			responses: ["^"],
			exact: true,
			delay: 1000,
			probability: 0.2,
			timeout: 10*1000
		}
	},
	{
		name: "HeartReply",
		type: "ChatReplyTrigger",
		options: {
			matches: ["<3"],
			responses: ["</3","<3"],
			exact: true,
			delay: 500,
			probability: 0.5,
			timeout: 60*60*1000 }},
	{
		name: "PingReply",
		type: "ChatReplyTrigger",
		options: {
			matches: ["ping"],
			responses: ["pong"],
			exact: true,
			delay: 1000,
			probability: 1,
			timeout: 10*1000 }},
/*	you probably don't have :D: or :medicon: emotes on your bot,so this is commented out.
	{
		name: "HealReply",
		type: "ChatReplyTrigger",
		options: {
			matches: ["heal","health","heal me","i'm hurt","I'm hurt","im hurt","Im hurt"],
			responses: [":medicon:"],
			exact: true,
			delay: 1000,
			probability: 1,
			timeout: 10*1000 }},
		name: "GrinReply",
		type: "ChatReplyTrigger",
		options: {
			matches: [":D"],
			responses: [":D:"],
			exact: true,
			delay: 500,
			probability: 0.5,
			timeout: 60*1000 }},
*/	{
		name: "SteveHoltReply",
		type: "ChatReplyTrigger",
		options: {
			matches: ["steve holt","steve holt!"],
			responses: ["\\o/"],
			exact: false,
			delay: 500,
			timeout: 10*1000
		}
	},
	{
		name: "SteamIDCheck",
		type: "SteamrepTrigger",
		options: {
			command: "!steamrep",
			delay: 2000,
			timeout: 5000
		}
	},
	// Weather trigger.
	{
		name: "Weather",
		type: "WeatherTrigger",
		options: {
			apikey: "replaceme",
			conditions: '!weather',
			forecast: '!forecase',
			forecastMetric: false;
		}
	},
	// Reply triggers that will only respond to a particular user
	{
		name: "SingleUserReply",
		type: "ChatReplyTrigger",
		options: {
			matches: ["hi bot"],
			responses: ["hi boss!"],
			exact: true,
			users: ["76561197961244239"]
		}
	},

	//sends a message to a destination every X ms
	{
		name: "MessageIntervalTrigger",
		type: "MessageIntervalTrigger",
		options: {
			interval: 5*60*1000, //every 5 minutes. You probably want it higher.
			message: "something interesting, but not spammy",
			destination: "103582791438731217" //please don't spam my chat
		}
	},

	// Sample regex trigger,"mate" will be responded to with "mmaaaate",
	// "mmaaaate" will be responded to with "mmmaaaaaaate",etc
	{
		name: "MateEscalation",
		type: "RegexReplaceTrigger",
		options: {match: "^(m+?)(a+?)te(s??)$",response: "{0}m{1}aaate{2}",delay: 500}
	},

	// Butt bot,replace a random word from someone's message with "butt" about once every 50 messages
	{
		name: "ButtBot",
		type: "ButtBotTrigger",
		options: {replacement: "butt",probability: 0.02,delay: 1000 }
	},

	// Chat reply that doesn't need a particular message to trigger,just a random reply about
	// once every 100 messages (and no more than once an hour)
	{
		name: "RandomReply",
		type: "ChatReplyTrigger",
		options: {
			matches: [],
			responses: ["ლ(ಠ益ಠლ)","щ(ﾟДﾟщ)","omg","(ﾉಥ益ಥ)ﾉ","¯\\_(ツ)_/¯"],
			delay: 500,
			probability: 0.01,
			timeout: 60*60*1000
		}
	},

	// Cleverbot reply that only happens when the word "cleverbot" is mentioned
	{
		name: "DirectCleverbotReply",
		type: "CleverbotTrigger",
		options: {keywords: ["cleverbot"] }
	},

	// Random cleverbot reply that triggers randomly about once every 100 messages
	{
		name: "RandomCleverbotReply",
		type: "CleverbotTrigger",
		options: {probability: 0.01,timeout: 30*60*1000 }
	},

	// Say something when a user joins chat
	{
		name: "SteveHoltEnter",
		type: "MessageOnJoinTrigger",
		options: {
			user: "76561197961244239",
			message: "STEVE HOLT! \\o/",
			probability: 0.5,
			delay: 1000,
			timeout: 24*60*60*1000
		}
	},

	//Query Urban Dictionary using their *unofficial* api when a message starts with !urban
	{
		name: "UrbanDictionaryTrigger",
		type: "UrbanDictionaryTrigger",
		options: {command: "!urban" }
	},

	// Post all links from chat to tumblr,and also post things on command
	{
		name: "TumblrTrigger",
		type: "TumblrTrigger",
		options: {
			autoPost: true,
			autoPostContext: false,
			blogName: "XXX",
			consumerKey: "XXX",
			consumerSecret: "XXX",
			token: "XXX",
			tokenSecret: "XXX"
		}
	},
	//look for posted links,then respond with page title
	{
		name: 'linkname',
		type: 'LinkNameTrigger',
		options: {}
	},
	// Greet every enterin person by name
	{
		name: "unnamed enter",
		type: "DoormatTrigger",
		options: {
			delay: 4000,
			probability: 1.0,
			timeout: 60*1000
		}
	},
	//Private message trigger text
	{
		name: "PmReply",
		type: "ChatPmTrigger",
		options: {
			matches: ["whisper"],
			responses: ["shh! secret!"],
			exact: true,
			delay: 1000,
			probability: 1,
			timeout: 10*1000 }},
	// Search YouTube and respond with the top result whenever someone types !yt <query>,rickroll about 1 every 100 times
	{
		name: "Youtube",
		type: "YoutubeTrigger",
		options: {command: "!yt",rickrollChance: 0.01 }
	},

	//notify on github activity
	{
		name: 'GitHubWebHookTrigger',
		type: 'GithubTrigger',
		options: {
			rooms: ['103582791438731217'],
			secret: 'replaceme',
			path: '/GitHubWebHook',
			disabled: ['pull_request/synchronize','gollum']
		}
	},
];
