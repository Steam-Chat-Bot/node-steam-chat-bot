// this file contains example trigger config/definitions and is meant to be required and passed into ChatBot.addTriggers()

var adminUser = '76565196008335999';   // this is an example of a user that's allowed to use commands nobody else can; see how it's used below.
var ignoredUser = '76565196178365111'; // this is an example of a user that's not allowed to use commands everyone else can; see how it's used below.
var ignoredChat = '47598124341';       // rooms:[] works exactly the same as users: [], only it specifies which groupchats a command may be used in
var allowedChat = '978255';            // ignored: [] allows steamid64s for both groupchats and users. If a user's steamid64 matches, he can't use the command; same if the groupchat it's posted in matches.

module.exports = [
	// Commands to stop/unstop the bot from saying anything in a chatroom
	{ 
		name: 'MuteCommand', 
		type: 'BotCommandTrigger', 
		options: { 
			matches: ['!mute','stfu bot','bot, stfu','shut up, bot','bot, shut up'], 
			exact: true,
			ignore: [ignoredUser],
			callback: ["mute"] // calls ChatBot.mute()
		} 
	},
	{ 
		name: 'UnmuteCommand', 
		type: 'BotCommandTrigger', 
		options: { 
			matches: ['!unmute', '!unpause','wake up, bot','bot, wake up','wake up bot','bot wake up'], 
			exact: true,
			ignore: [ignoredUser],
			callback: ["unmute"] // calls ChatBot.unmute()
		} 
	},

	{ name: 'SayTrigger',          type: 'SayTrigger',          options: { users: [adminUser] } },
	{ name: 'ModerateTrigger',     type: 'ModerateTrigger',     options: { users: [adminUser] } },
	{ name: 'BanTrigger',          type: 'BanTrigger',          options: { users: [adminUser] } },
	{ name: 'KickTrigger',         type: 'KickTrigger',         options: { users: [adminUser] } },
	{ name: 'UnbanTrigger',        type: 'UnbanTrigger',        options: { users: [adminUser] } },
	{ name: 'UnmoderateTrigger',   type: 'UnmoderateTrigger',   options: { users: [adminUser] } },
	{ name: 'UnlockChatTrigger',   type: 'UnlockChatTrigger',   options: { users: [adminUser] } },
	{ name: 'LockChatTrigger',     type: 'LockChatTrigger',     options: { users: [adminUser] } },
	{ name: 'LeaveChatTrigger',    type: 'LeaveChatTrigger',    options: { users: [adminUser] } },
	{ name: 'SetStatusTrigger',    type: 'SetStatusTrigger',    options: { users: [adminUser] } },
	{ name: 'SetNameTrigger',      type: 'SetNameTrigger',      options: { users: [adminUser] } },
	{ name: 'JoinChatTrigger',     type: 'JoinChatTrigger',     options: { users: [adminUser] } },
	{ name: 'RemoveFriendTrigger', type: 'RemoveFriendTrigger', options: { users: [adminUser] } },
	{ name: 'AddFriendTrigger',    type: 'AddFriendTrigger',    options: { users: [adminUser] } },

// Informational commands
	{ name: 'HelpCmd',   type: 'ChatReplyTrigger', options: {
		matches: ['!help','!triggers','!cmds','!commands'],
		responses: ['Please view my profile for a list of publicly commands and other triggers. Not all triggers are allowed in all chats.'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'BugsCmd',   type: 'ChatReplyTrigger', options: {
		matches: ['!bug','!bugs','!issue','!feature'],
		responses: ['You can submit bugs and feature requests at http://github.com/Efreak/node-steam-chat-bot/issues'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'OwnerCmd',  type: 'ChatReplyTrigger', options: {
		matches: ['!owner','!efreak'],
		responses: ['My owner is http://steamcommunity.com/profiles/76561198008335925/'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'SourceCmd', type: 'ChatReplyTrigger', options: {
		matches: ['!source','!about'],
		responses: ['This bot is based on node-steam-chat-bot, a wrapper around node-steam, which is a nodejs port of SteamKit2. You can find full source code and some documentation and examples at http://github.com/Efreak/node-steam-chat-bot'],
		exact: true, probability: 1, timeout: 1000 } },

	// Automatically accept invites from any user to the specified group chat. I have reports that this may not currently work.
	{ 
		name: 'AcceptChatInvite', 
		type: 'AcceptChatInviteTrigger', 
		options: { 
			chatrooms: {
				"10358279143999997": "Hello! I'm Admin's obnoxious chatbot and I'm here to spam you all! :D:"
			},
			autoJoinAfterDisconnect: true
		} 
	},


	// Search Google and respond with the top result whenever someone types !g <query>
	{
		name: 'Google',
		type: 'GoogleTrigger',
		options: { command: '!g' }
	},
	{
		name: 'Google2',
		type: 'GoogleTrigger',
		options: { command: '!google' }
	},

	// Search Google Images and respond with the top result whenever someone types !gi <query>
	{
		name: 'GoogleImages',
		type: 'GoogleImagesTrigger',
		options: { command: '!gi' }
	},
	{
		name: 'GoogleImages2',
		type: 'GoogleImagesTrigger',
		options: { command: '!image' }
	},

	{
		name: 'Translate',
		type: 'TranslateTrigger', //uses http://hablaa.com/api' to translate when someone types !translate <word> <start lang> <eng lang> or displays a list of language codes using !languages
		options: {
			translatecommand: '!translate',
			languagescommand: '!languages'
		}
	},
	// Automatically accept all friend requests. I have reports that this may not currently work.
	{ name: 'AcceptFriendRequest', type: 'AcceptFriendRequestTrigger' },

	// Reply triggers - respond to a chat/private message if it matches a set of inputs 
	// (case-insensitive exact or substring match), and choose randomly from a set of responses
	{	name: 'EmptyQuoteReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: ['^'], 
			responses: ['^'], 
			exact: true, 
			delay: 1000, 
			ignore: [ignoredUser],
			probability: 0.25, 
			timeout: 30*1000 } },
	{	name: 'PingReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: ['ping'], 
			responses: ['pong'], 
			exact: true, 
			delay: 1000, 
			probability: 1, 
			timeout: 30*1000 ,
			ignore: [ignoredUser] } },
	{	name: 'HealReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: ["heal","health","heal me","i'm hurt","I'm hurt","im hurt","Im hurt"], 
			responses: [':medicon:',':health:',':medkit:',':medpack:'], 
			delay: 1000, 
			probability: 25, 
			timeout: 2*60*60*1000 } },
	{	name: 'HeartReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: ['<3'], 
			responses: ['</3', '<3'], 
			delay: 500, 
			probability: 0.3, 
			timeout: 10*60*1000 } },
	{	name: 'SmileReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: ['☺',':)'], 
			responses: ['☹'],
			delay: 500, 
			probability: 0.3, 
			timeout: 30*60*1000 } },
	{	name: 'FrownReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: ['☹',':('], 
			responses: ['☺'],
			delay: 500, 
			probability: 0.3, 
			timeout: 30*60*1000 } },
	{	name: 'RandomEmoticonReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: ['!emote','!emoticon'], 
			responses: [':D:',':B1:','☺','☻','♥','♪','♫'],
			exact: true, 
			delay: 500, 
			probability: 1, 
			timeout: 2*1000 } },
	{	name: 'GrinReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: [':D','ːDː'], 
			responses: [':D:'], 
			delay: 500, 
			probability: 0.15, 
			timeout: 60*1000 } },
	{	name: 'ThanksReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: ['thanks','thx'], 
			responses: ['yw','you\'re welcome','any time'], 
			delay: 500, 
			probability: 0.15, 
			timeout: 30*60*1000 } },
	{	name: 'NameReply', type: 'ChatReplyTrigger', 
		options: { 
			matches: ['Bot','Annoying Chatbot'], 
			responses: ["That\'s my name!","That's my name! Don't wear it out!","I don't like you. Go away!"], 
			exact: true, 
			delay: 500, 
			probability: 1, 
			timeout: 5*60*1000 } },
	{	name: 'NotMyName', type: 'ChatReplyTrigger', 
		options: { 
			matches: ['Nice bot','Nice bot!'], 
			responses: ['No I\'m not','Are you talking to me?'], 
			exact: true, 
			delay: 500, 
			probability: 1, 
			timeout: 30*60*1000 } },

	//steamrep command
	{	name: 'SteamIDCheck', 
		type: 'SteamrepTrigger', 
		options: { 
			command: "!steamrep", 
			delay: 2000, 
			timeout: 5*1000 } },

	// Reply triggers that will only respond to a particular user
	{	name: 'SingleUserReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: ['hi bot'], 
			responses: ['hi boss!','hi master!'], 
			exact: true, 
			users: adminUser } },

	{	name: 'IsUp', 
		type: 'IsUpTrigger',
		options: { command: '!isup' } },

/*
//This is commented out because abusers can crash the bot with it.
//The function is a simple wrapper around a library that has no limit on the number of rolls, or the number of sides per die, and no error checking. Boo!
	{	name: 'RollDice', 
		type: 'RollTrigger', 
		options: { 
			command: '!dice', 
			delay: 500,
			timeout: 1000 } },
	{	name: 'RollDice2', 
		type: 'RollTrigger', 
		options: { 
			command: 'roll', 
			delay: 500,
			timeout: 1000 } },
*/	// Sample regex trigger, "mate" will be responded to with "mmaaaate", 
	// "mmaaaate" will be responded to with "mmmaaaaaaate", etc
	{	name: 'MateEscalation', 
		type: 'RegexReplaceTrigger',
		options: {
			match: "^(m+?)(a+?)te(s??)$",
			response: '{0}m{1}aaate{2}',
			delay: 500 } },

	// Butt bot, replace a random word from someone's message with "butt" about once every 50 messages
	{ 	name: 'ButtBot', 
		type: 'ButtBotTrigger', 
		options: {
			replacement: 'butt',
			probability: 0.008,
			delay: 1000,
			timeout: 2*60*60*1000 } },
	{	name: 'ButtReply', 
		type: 'ChatReplyTrigger', 
		options: {
			matches: ['butt'],
			responses: ['lol, you said butt'],
			probability: 0.5,
			timeout: 2*60*60*1000,
			delay: 500 } },

	// Chat reply that doesn't need a particular message to trigger, just a random reply about 
	// once every 100 messages (and no more than once an hour)
	{	name: 'RandomReply', 
		type: 'ChatReplyTrigger', 
		options: { 
			matches: [], 
			responses: ['ლ(ಠ益ಠლ)', 'щ(ﾟДﾟщ)', 'omg', '(ﾉಥ益ಥ)ﾉ', '¯\\_(ツ)_/¯',' ( ͡° ͜ʖ ͡°)','(╯°□°）╯︵ ┻━┻)','┬─┬ノ( º _ ºノ)',' (ノಠ益ಠ)ノ彡┻━┻','ಠ_ಠ',' ಠ_ರೃ','ಥ_ಥ','⊙▃⊙'], 
			delay: 5*60*1000,
			probability: 0.05, 
			timeout: 60*60*1000 } },

	// Cleverbot reply that only happens when the word "cleverbot" is mentioned
	{	name: 'DirectCleverbotReply', 
		type: 'CleverbotTrigger', 
		options: { keywords: ['cleverbot'] } },
	// Random cleverbot reply that triggers randomly about once every 100 messages
	{	name: 'RandomCleverbotReply', 
		type: 'CleverbotTrigger', 
		options: { probability: 0.005, timeout: 30*60*1000 } },

	// Say something when a user joins chat
	{	name: 'MasterEnter', 
		type: 'MessageOnJoinTrigger', 
		options: { 
			user: adminUser,
			message: "Hello, master!", 
			probability: 1, 
			timeout: 15*60*1000, 
			ignore: [ignoredChat], //Don't send welcome message in specific chats. Yes, the 'ignore' param works for both users and groups.
			delay: 1000 } },
	{	name: 'EightBall', 
		type: 'ChatReplyTrigger', 
		options: {
			matches: ['!8ball'],
			responses: ['It is certain','It is decidedly so','Without a doubt','Yes, definitely','You may rely on it','As I see it, yes','Most likely','Outlook good','Yes','Signs point to yes','Reply hazy, try again','Ask again later','Better not tell you now','Cannot predict now','Concentrate and ask again',"Don't count on it",'My sources say no','Outlook not so good','Very doubtful'],
			timeout: 2*1000,
			delay: 500 } },

/*	// Post all links from chat to tumblr, and also post things on command
	{	name: 'TumblrTriggerYCJGTFO', type: 'TumblrTrigger', 
		options: { autoPost: true, autoPostContext: false, blogName: 'ycjgtfo', 
			consumerKey: 'XXX',
			consumerSecret: 'XXX',
			token: 'XXX',
			tokenSecret: 'XXX' }  }, //you may also want to add a rooms:[] param so it doesn't post to the same tumblr for all groups.

*/	// Search YouTube and respond with the top result whenever someone types !yt <query>, rickroll about 1 every 100 times
	{	name: 'Youtube', 
		type: 'YoutubeTrigger', 
		options: {
			command: '!yt',
			rickrollChance: .01	} },

        // Query urban dictionary on !ud
        {       name: 'UD',
                type: 'UrbanDictionaryTrigger',
                options: {
                        command: '!ud',
			timeout: 1000 } },

	//check steamrep on every user who joins. Notify the channel if they're a scammer.
	{	name: 'SteamrepOnJoin',
		type: 'SteamrepOnJoinTrigger',
		options: {} },

	{
		name: 'BTC',
		type: 'BitcoinTrigger',
		options: {
			clientID: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
			clientSecret: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
			redirectURI: 'http://localhost:8080/coinbase/'
		}
	}
];
