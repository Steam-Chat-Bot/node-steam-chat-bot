#!/bin/node -
function $(arg){ return arg; }

/* *************************

This config file is LIVE.
That means that this is the config I'm actually *using* for my bots. Yes, this *exact* file. It may not always be up to date, but if it ssems broken, lemme know and I'll update the repo.
Miley Verisse: https://steamcommunity.com/profiles/76561198055685680/
  - My personal bot, is spread through various groupchats for various reasons
/r/SGS Bot: https://steamcommunity.com/profiles/76561198055589142/
  - Run for Reddit Game Swap only.
Poonicorn: https://steamcommunity.com/profiles/76561198051144238/
  - Run for SteamGifts Trivia chat, and for some personal functions that aren't actually in this file (I use a separate bot process for those)
rGOG: http://steamcommunity.com/profiles/76561198055562682
  - Run for Reddit Gift Of Games only.

************************* */


var common = require('./common.js');
var reverseObject = common.reverseObject;
var rooms = common.rooms;
var users = common.users;
var globalIgnores = common.globalIgnores;

//stuff for /r/sgsBot (these usernames don't get used elsewhere)
var sgsGamesList = [221410];
var sgsGamesListMuted = [];

var gogGamesList = [221410];
var gogGamesListMuted = [];

var sgsAdminsNames = { //for easy reading and editing
	'76561197981125077': 'blueshiftlabs',	'76561198054386037': 'rikker',	'76561198000824354': 'dux0r',	'76561198019530214': 'eliteArsenal',
	'76561198052766460': 'WarNev3rChanges',	'76561197989914453': 'kodiak',	'76561198082770900': 'puck',	'76561197983311223': 'advicebanana',
	'76561198056461793': 'notatraitor',	'76561197986551592': 'jon',	'76561198057961078': 'warheat',	'76561197965063884': 'grimbald',
	'76561197998931747': 'so',		'76561198003266961': 'many',	'76561198059455420': 'people',	'76561198027913613': 'that',
	'76561197961355969': 'I',		'76561198014974848': 'dont',	'76561198025292225': 'know', //sgs has too many admins, clean yourselves up pls...
	'76561198008335925': 'efreak', //and me, because IM SPESHUL!
	'76561198074201273': 'NEO' //has a vac ban
}
sgsAdmins = [];
for (var id in sgsAdminsNames) { //for actual use
	sgsAdmins.push(id);
}

var gogAdminsNames = { //there will probably be more later
	'76561198034107051': 'Aakash',
	'76561198008335925': 'efreak' //and me, because IM SPESHUL!
}
var gogAdmins = []
for (var id in gogAdminsNames) {
	gogAdmins.push(id);
}

//store private areas of configuration separately so I can share this file
var logLevel = 'info';

var cfg = require('./configs/private.js');
//this file mostly has private info in it, like passwords and crap.
//Doing it this way allows me to pust this config file in the public repo
//Pretty much the only exceptions to this is that there's items with long parameter lists;
//I've put those in there as well to keep this file clean(er)
//like this file could ever be clean, with all the crap in it...

var gamesList = cfg.games; //the games list is too long. We'll leave it out.
var delayedJoin = cfg.delayedJoin; //make sure bots join chats they should be in, glitches abound
//this function basically sets increasing timeouts to join each bot to each groupchat
//not actually necessary anymore (I fixed this bug *ages* ago), but I'm keeping it anyways

var ChatBot = require('./').ChatBot;




var sgsBot = new ChatBot(cfg.sgs.username, cfg.sgs.password, {
	guardCode: 'V4XFP',
	logFile: true,
	autoReconnect: true,
	autojoinFile: cfg.sgs.autojoinFile,
	steamapikey: cfg.steamapikey,
	babysitTimer: 30000,
//	sentryFile: cfg.sgs.sentryFile,
	logLevel: logLevel,
	consoleLogLevel: logLevel,
	webServerPort: cfg.sgs.webServerPort,
	ignores: globalIgnores
});

var sgsChats = {};
sgsChats[rooms.sgs]= 'Hello! I was invited here by $invitername to tattle on scammers! :D:';
sgsBot.addTriggers([
	{ name: 'logInfoTrigger',      type: 'BotCommandTrigger',     options: { matches: ['!log','!logs','logs?'], exact:true, callback: function(bot,data){bot.sendMessage(data.toId,"You can find the complete log for this chat at https://sgs.efreakbnc.net/logs/files/g-rSGS.txt and you can find a live updating log with 100 lines of history at https://sgs.efreakbnc.net/logs/live#room=103582791432826618&lines=100");}}},
	{ name: 'WebUI',               type: 'WebUI',                 options: {
		public: cfg.sgs.webUIPublic,
		admins:[users.efreak]
	} },
	{ name: 'stopplaying',         type: 'BotCommandTrigger',     options: { matches: ['!stopplaying'],  exact:true, users:sgsAdmins, callback: function(bot,data){bot.setGames([]);}}},
	{ name: 'startplaying',        type: 'BotCommandTrigger',     options: { matches: ['!startplaying'], exact:true, users:sgsAdmins, callback: function(bot,data){bot.setGames(sgsGamesList);}}},
	{ name: 'logTrigger',          type: 'LogTrigger',            options: {roomNames: common.roomNames, linesToSend:250} },
	{ name: 'MuteCommand',         type: 'BotCommandTrigger',     options: { matches: ['!mute'],   exact: true, callback: function(bot) { bot.mute();   bot.setGames([sgsGamesListMuted]);      bot.setPersonaState(4); } } },
	{ name: 'UnmuteCommand',       type: 'BotCommandTrigger',     options: { matches: ['!unmute'], exact: true, callback: function(bot) { bot.unmute(); bot.setGames(sgsGamesList); bot.setPersonaState(1); } } },
	{ name: 'InfobotTrigger',      type: 'InfobotTrigger',        options: { admin: sgsAdmins,  userlearn:false } },
	{ name: 'SayTrigger',          type: 'SayTrigger',            options: { users: sgsAdmins } },
	{ name: 'JoinRedditGamesTrigger', type: 'BotCommandTrigger',  options: { matches: ['!joinrg','!joinrgs','!sgs','!joinchat'], exact:true,callback: function(bot) { bot.joinChat(rooms.sgs);}}},
	{ name: 'Notification',        type: 'NotificationTrigger',   options: { roomNames: common.roomNames, sendmailArgs:cfg.mailArgs,sendmailPath:cfg.mailPath,address:cfg.fromAddress,banned:globalIgnores}}, //!notification
	{ name: 'PlayGameTrigger',     type: 'PlayGameTrigger',       options: { users: sgsAdmins } },
	{ name: 'ModerateTrigger',     type: 'ModerateTrigger',       options: { users: sgsAdmins } },
	{ name: "AcceptChatInvite",
		type: "AcceptChatInviteTrigger",
		options: {
			chatrooms: sgsChats, //anyone can invite the bot to steamgameswap
			joinAll: [users.efreak], //only efreak can invite the bot to other groupchats (used only for testing, or other admins would be allowed)
			autoJoinAfterDisconnect: true
		}
	},
	{ name: 'KarmaTrigger',        type: 'KarmaTrigger',          options: { users: sgsAdmins}},
	{ name: 'BanTrigger',          type: 'BanTrigger',            options: { users: sgsAdmins } },
	{ name: 'KickTrigger',         type: 'KickTrigger',           options: { users: sgsAdmins } },
	{ name: 'UnbanTrigger',        type: 'UnbanTrigger',          options: { users: sgsAdmins } },
	{ name: 'UnmoderateTrigger',   type: 'UnmoderateTrigger',     options: { users: sgsAdmins } },
	{ name: 'UnlockChatTrigger',   type: 'UnlockChatTrigger',     options: { users: sgsAdmins } },
	{ name: 'LockChatTrigger',     type: 'LockChatTrigger',       options: { users: sgsAdmins } },
	{ name: 'LeaveChatTrigger',    type: 'LeaveChatTrigger',      options: { users: sgsAdmins } },
	{ name: 'SetStatusTrigger',    type: 'SetStatusTrigger',      options: { users: sgsAdmins } },
	{ name: 'SetNameTrigger',      type: 'SetNameTrigger',        options: { users: sgsAdmins } },
	{ name: 'JoinChatTrigger',     type: 'JoinChatTrigger',       options: { users: sgsAdmins } },
	{ name: 'RemoveFriendTrigger', type: 'RemoveFriendTrigger',   options: { users: sgsAdmins } },
	{ name: 'AddFriendTrigger',    type: 'AddFriendTrigger',      options: { users: sgsAdmins } },
	{ name: 'InfoTrigger',         type: 'InfoTrigger',           options: { users: sgsAdmins } },
	{ name: 'HelpCmd',             type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!help','!triggers','!cmds','!commands'], responses: ['Please view my profile for a list of public commands and other triggers. Not all triggers are allowed in all chats. For information on SGS, use !rules, !flair, or !faq (please use these commands in private)']} },
	{ name: 'BugsCmd',             type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!bug','!bugs','!issue','!feature'],      responses: ['You can submit bugs and feature requests at https://github.com/Steam-Chat-Bot/node-steam-chat-bot/issues']} },
	{ name: 'OwnerCmd',            type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!owner','!efreak'],                      responses: ['My owner is https://steamcommunity.com/profiles/76561198008335925/']} },
	{ name: 'SourceCmd',           type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!source','!about'],                      responses: ['This bot is a slightly modified node-steam-chat-bot, https://github.com/Steam-Chat-Bot/node-steam-chat-bot']} },
	{ name: 'FAQCmd',              type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!faq'],                                  responses: ['The FAQ can be found at https://www.reddit.com/r/SteamGameSwap/wiki/faq']} },
	{ name: 'RulesCmd',            type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!rules'],                                responses: ['The rules can be found at https://www.reddit.com/r/SteamGameSwap/wiki/rules_and_restrictions']} },
	{ name: 'FlairCmd',            type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!flair'],                                responses: ['The flair guide is at https://www.reddit.com/r/SteamGameSwap/wiki/flair']} },
	{ name: 'Google',              type: 'GoogleTrigger',         options: { command: '!g' } },	{ name: 'Google2',             type: 'GoogleTrigger',         options: { command: '!google' } },
	{ name: 'EvalTrigger',         type: 'EvalTrigger',           options: { users: [users.efreak],evalUnsafe:true }},
//	{ name: 'GoogleImages',        type: 'GoogleImagesTrigger',   options: { command: '!gi' } },	{ name: 'GoogleImages2',       type: 'GoogleImagesTrigger',   options: { command: '!image' } },
	{ name: 'SingleUserReply',     type: 'ChatReplyTrigger',      options: { exact: true, delay: 0,   probability: 1, timeout: 0,             matches: ['hi bot'], responses: ['hi boss!'], users: sgsAdmins } },
	{ name: 'PingReply',           type: 'ChatReplyTrigger',      options: { exact: true, delay: 0,   probability: 1, timeout: 30 * 1000,     matches: ['ping'],   responses: ['pong'] } },
	{ name: 'RedditTrigger',       type: 'RedditTrigger',         options: cfg.redditrepOptions },
	{ name: 'NameReply',           type: 'ChatReplyTrigger',      options: { exact: true, delay: 500, probability: 1, timeout: 5 * 60 * 1000, matches: ['/r/SGS Bot', 'SteamGameSwap Bot','/r/SGS Bot?', 'SteamGameSwap Bot?', 'bot?', 'what bot?'], responses: ['That\'s me! I\'m the official bot for /r/SGS groupchat! Please see my profile for available commands.'] } },
	{ name: 'ProfileCheckTrigger', type: 'ProfileCheckTrigger',   options: { ignore: common.trustedBots }}, //these are bots that idle in my dev chat. Most of them have blank/locked/new/etc profiles.
	{ name: 'SteamrepOnJoin',      type: 'SteamrepOnJoinTrigger'},
	{ name: 'SteamrepCommand',     type: 'SteamrepTrigger',       options: { command: "!steamrep",    delay: 0,       timeout: 2 * 1000 } },
//	{ name: 'IsUp',                type: 'isupTrigger',           options: { command: '!isup', delay: 500, timeout: 1 * 60 * 1000 } },
	{ name: 'Youtube',             type: 'YoutubeTrigger',        options: { command: '!yt', rickrollChance: .01  } },
	{ name: 'RandomGameTrigger',   type: 'RandomGameTrigger',     options: { timeout: 5*1000, delay: 500} },
	{ name: 'BanCheckTrigger',     type: 'BanCheckTrigger'},
	{ name: 'ReloadTriggers',      type: 'BotCommandTrigger',     options: { matches: ['!reload'],   exact: true, callback: function(bot) { var triggerDetails = bot.getTriggerDetails(); bot.clearTriggers(); bot.addTriggers(triggerDetails); } } },
	{ name: 'MoneyTrigger',        type: 'MoneyTrigger',          options: { apikey: cfg.moneyapikey} },
	{ name: 'KeyDropTrigger',      type: 'KeyDropTrigger',        options: { users: sgsAdmins, room: '103582791432826618'}}
]);

sgsBot.express.get('/sgskeys', function(req,res) {
	res.redirect(301,"https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.return_to=http%3A%2F%2Fsgs.efreakbnc.net%2Fkeys%2Fverify&openid.realm=http%3A%2F%2Fsgs.efreakbnc.net%2Fkeys");
}); //seems like the openid implementation stores stuff in the global scope when it shouldn't

sgsBot.onLogon = function(that){
	that.setGames(sgsGamesList);
	that.unmute();
}
sgsBot.connect();





var gogBot = new ChatBot(cfg.gog.username,cfg.gog.password, {
	guardCode: cfg.gog.guardCode,
	logFile: true,
	autoReconnect: true,
	autojoinFile: cfg.gog.autojoinFile,
	steamapikey: cfg.steamapikey,
	babysitTimer: 300000,
	logLevel: logLevel,
	consoleLogLevel: logLevel,
	webServerPort: cfg.gog.webServerPort,
	ignores: globalIgnores
});
var gogChats = {};
gogChats[rooms.gog] = cfg.inviteMsg;

gogBot.addTriggers([
	{ name: 'logInfoTrigger',      type: 'BotCommandTrigger',     options: { matches: ['!log','!logs','logs?'], exact:true, callback: function(bot,data){bot.sendMessage(data.toId,"You can find the complete log for this chat at https://gog.efreakbnc.net/logs/g-Gift%20of%20Games.txt and you can find a live updating log with 100 lines of history at https://gog.efreakbnc.net/logs/live#room=103582791436617779&lines=100");}}},
	{ name: 'WebUI',               type: 'WebUI',                 options: {
		public: cfg.gog.webUIPublic,
		admins:[users.efreak,users.aakash]
	} },
	{ name: 'stopplaying',         type: 'BotCommandTrigger',     options: { matches: ['!stopplaying'],  exact:true, users:gogAdmins, callback: function(bot,data){bot.setGames([]);}}},
	{ name: 'startplaying',        type: 'BotCommandTrigger',     options: { matches: ['!startplaying'], exact:true, users:gogAdmins, callback: function(bot,data){bot.setGames(gogGamesList);}}},
	{ name: 'logTrigger',          type: 'LogTrigger',            options: { roomNames: common.roomNames, linesToSend:250} },
	{ name: 'MuteCommand',         type: 'BotCommandTrigger',     options: { matches: ['!mute'],   exact: true, callback: function(bot) { bot.mute();   bot.setGames([gogGamesListMuted]);      bot.setPersonaState(4); } } },
	{ name: 'UnmuteCommand',       type: 'BotCommandTrigger',     options: { matches: ['!unmute'], exact: true, callback: function(bot) { bot.unmute(); bot.setGames(gogGamesList); bot.setPersonaState(1); } } },
	{ name: 'InfobotTrigger',      type: 'InfobotTrigger',        options: { admin: gogAdmins,  userlearn:false, timeout:30*1000 } },
	{ name: 'SayTrigger',          type: 'SayTrigger',            options: { users: gogAdmins } },
	{ name: 'JoinRedditGOGTrigger', type: 'BotCommandTrigger',    options: { matches: ['!joingog','!joinrgog','!gog','!joinchat'], exact:true,callback: function(bot) { bot.joinChat(rooms.rGOG);}}},
	{ name: 'Notification',        type: 'NotificationTrigger',   options: { roomNames: common.roomNames, sendmailArgs:cfg.mailArgs,sendmailPath:cfg.mailPath,address:cfg.fromAddress,banned:globalIgnores}}, //!notification
	{ name: 'PlayGameTrigger',     type: 'PlayGameTrigger',       options: { users: gogAdmins } },
	{ name: 'ModerateTrigger',     type: 'ModerateTrigger',       options: { users: gogAdmins } },
	{ name: 'DiscordRelay',        type: 'DiscordRelay',          options: {
		token: cfg.discordToken,		//your discord bot's OAuth2 token. REQUIRED.
		steamChat: '103582791436617779',		//the steamid64 for your groupchat
		discordChannelID: '217737044347191306',	//the ChannelID of your Discord chat.
		discordServerID: '217737044347191306',
		sendExtras: true,
		owner: "Efreak"
	}},
	{ name: "AcceptChatInvite",
		type: "AcceptChatInviteTrigger",
		options: {
			chatrooms: gogChats, //anyone can invite the bot to steamgameswap
			joinAll: [users.efreak], //only efreak can invite the bot to other groupchats (used only for testing, or other admins would be allowed)
			autoJoinAfterDisconnect: true
		}
	},
	{ name: 'KarmaTrigger',        type: 'KarmaTrigger',          options: { users: gogAdmins } },
	{ name: 'BanTrigger',          type: 'BanTrigger',            options: { users: gogAdmins } },
	{ name: 'KickTrigger',         type: 'KickTrigger',           options: { users: gogAdmins } },
	{ name: 'UnbanTrigger',        type: 'UnbanTrigger',          options: { users: gogAdmins } },
	{ name: 'UnmoderateTrigger',   type: 'UnmoderateTrigger',     options: { users: gogAdmins } },
	{ name: 'UnlockChatTrigger',   type: 'UnlockChatTrigger',     options: { users: gogAdmins } },
	{ name: 'LockChatTrigger',     type: 'LockChatTrigger',       options: { users: gogAdmins } },
	{ name: 'LeaveChatTrigger',    type: 'LeaveChatTrigger',      options: { users: gogAdmins } },
	{ name: 'SetStatusTrigger',    type: 'SetStatusTrigger',      options: { users: gogAdmins } },
	{ name: 'SetNameTrigger',      type: 'SetNameTrigger',        options: { users: gogAdmins } },
	{ name: 'JoinChatTrigger',     type: 'JoinChatTrigger',       options: { users: gogAdmins } },
	{ name: 'RemoveFriendTrigger', type: 'RemoveFriendTrigger',   options: { users: gogAdmins } },
	{ name: 'AddFriendTrigger',    type: 'AddFriendTrigger',      options: { users: gogAdmins } },
	{ name: 'InfoTrigger',         type: 'InfoTrigger',           options: { users: gogAdmins } },
	{ name: 'HelpCmd',             type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!help','!triggers','!cmds','!commands'], responses: ['Please view my profile for a list of public commands and other triggers. Not all triggers are allowed in all chats. For information on gog, use !rules, !flair, or !faq (please use these commands in private)']} },
	{ name: 'BugsCmd',             type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!bug','!bugs','!issue','!feature'],      responses: ['You can submit bugs and feature requests at https://github.com/Steam-Chat-Bot/node-steam-chat-bot/issues']} },
	{ name: 'OwnerCmd',            type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!owner','!efreak'],                      responses: ['My owner is https://steamcommunity.com/profiles/76561198008335925/']} },
	{ name: 'SourceCmd',           type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!source','!about'],                      responses: ['This bot is a slightly modified node-steam-chat-bot, https://github.com/Steam-Chat-Bot/node-steam-chat-bot']} },
	{ name: 'FAQCmd',              type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!faq'],                                  responses: ['The FAQ can be found at https://www.reddit.com/r/GiftofGames/wiki']} },
	{ name: 'RulesCmd',            type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!rules'],                                responses: ['The rules can be found at https://www.reddit.com/r/giftofgames/wiki/rules']} },
	{ name: 'FlairCmd',            type: 'ChatReplyTrigger',      options: { exact: true, probability: 1, timeout: 60 * 1000, matches: ['!flair'],                                responses: ['The flair guide is at https://www.reddit.com/r/giftofgames/wiki/flairinfo']} },
	{ name: 'Google',              type: 'GoogleTrigger',         options: { command: '!g', ignore: [rooms.rGOG]} },	{ name: 'Google2',             type: 'GoogleTrigger',         options: { command: '!google', ignore: [rooms.rGOG] } },
	{ name: 'EvalTrigger',         type: 'EvalTrigger',           options: { users: [users.efreak],evalUnsafe:true }},
//	{ name: 'GoogleImages',        type: 'GoogleImagesTrigger',   options: { command: '!gi' } },	{ name: 'GoogleImages2',       type: 'GoogleImagesTrigger',   options: { command: '!image' } },
	{ name: 'SingleUserReply',     type: 'ChatReplyTrigger',      options: { exact: true, delay: 0,   probability: 1, timeout: 0,             matches: ['hi bot'], responses: ['hi boss!'], users: gogAdmins } },
	{ name: 'PingReply',           type: 'ChatReplyTrigger',      options: { exact: true, delay: 0,   probability: 1, timeout: 30 * 1000,     matches: ['ping'],   responses: ['pong'] } },
	{ name: 'NameReply',           type: 'ChatReplyTrigger',      options: { exact: true, delay: 500, probability: 1, timeout: 5 * 60 * 1000, matches: ['/r/GOG Bot', 'GOG Bot','/r/GOG Bot?', 'GOG Bot?', 'bot?', 'what bot?'], responses: ['That\'s me! I\'m the official bot for /r/GOG groupchat! Please see my profile for available commands.'] } },
	{ name: 'ProfileCheckTrigger', type: 'ProfileCheckTrigger',   options: { ignore: common.trustedBots }}, //these are bots that idle in my dev chat. Most of them have blank/locked/new/etc profiles.
	{ name: 'SteamrepOnJoin',      type: 'SteamrepOnJoinTrigger'},
	{ name: 'SteamrepCommand',     type: 'SteamrepTrigger',       options: { command: "!steamrep",    delay: 0,       timeout: 2 * 1000 } },
//	{ name: 'IsUp',                type: 'isupTrigger',           options: { command: '!isup', delay: 500, timeout: 1 * 60 * 1000 } },
//no api key
//	{ name: 'Youtube',             type: 'YoutubeTrigger',        options: { command: '!yt', rickrollChance: .01  } },
	{ name: 'RandomGameTrigger',   type: 'RandomGameTrigger',     options: { timeout: 5*1000, delay: 500} },
	{ name: 'BanCheckTrigger',     type: 'BanCheckTrigger',       options: { ignore: [users.NEO]}},
	{ name: 'ReloadTriggers',      type: 'BotCommandTrigger',     options: { matches: ['!reload'],   exact: true, callback: function(bot) { var triggerDetails = bot.getTriggerDetails(); bot.clearTriggers(); bot.addTriggers(triggerDetails); } } },
	{ name: 'KeyDropTrigger',      type: 'KeyDropTrigger',        options: { users: gogAdmins, room: rooms.rGOG}}
]);

gogBot.express.get('/gogkeys', function(req,res) {
	res.redirect(301,"https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.return_to=http%3A%2F%2Fgog.efreakbnc.net%2Fkeys%2Fverify&openid.realm=http%3A%2F%2Fgog.efreakbnc.net%2Fkeys");
}); //seems like the openid implementation stores stuff in the global scope when it shouldn't

gogBot.onLogon = function(that){
	that.setGames(gogGamesList);
	that.unmute();
}
gogBot.connect();
