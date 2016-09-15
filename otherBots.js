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

var OPAdmins = [users.slipslot, users.baertel, users.manc, users.adrian, users.lewis, users.sag, users.efreak] //I not an admin. shhhhhh!
var OPRooms = [rooms.OPS,rooms.OPT,rooms.OPT2,rooms.OPG];

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
var miley = new ChatBot(cfg.miley.username, cfg.miley.password, {
	guardCode: 'PRPYK',
	logFile: true,
	autoReconnect: true,
	autojoinFile: cfg.miley.autojoinFile,
	steamapikey: cfg.steamapikey,
	babysitTimer: 300000,
//	sentryFile: cfg.miley.sentryFile,
	logLevel: logLevel,
	consoleLogLevel: logLevel,
	webServerPort: cfg.miley.webServerPort,
	ignores: globalIgnores
});

miley.addTriggers([
	{
		name: 'MuteCommand',
		type: 'BotCommandTrigger',
		options: {
			matches: ['!mute','stfu miley','miley, stfu','shut up, miley','miley, shut up'],
			exact: true,
			ignore: [rooms.Reddit,common.assholes.crowley],
			callback: function(bot) { bot.mute(); bot.setPrimaryGame(45100,250); }
		}
	},
	{
		name: 'UnmuteCommand',
		type: 'BotCommandTrigger',
		options: {
			matches: ['!unmute', '!unpause','wake up, miley','miley, wake up','wake up miley','miley wake up'],
			exact: true,
			ignore: [rooms.Reddit,common.assholes.crowley],
			callback: function(bot) { bot.unmute(); bot.setGames(gamesList); bot.setPrimaryGame(214610,250);}
		}
	},
	{ name: 'DiscordRelay',        type: 'DiscordRelay',          options: {
		token: cfg.discordToken,		//your discord bot's OAuth2 token. REQUIRED.
		steamChat: rooms.botDev,		//the steamid64 for your groupchat
		relays: [{
			discordChannelID: '225770030414036992',	//the ChannelID of your Discord chat.
			discordServerID: '215227458285338624',
			sendExtras: true,
			steamChat: rooms.botDev
		},{
			steamChat: rooms.OPG,			//the steamid64 for your groupchat
			discordChannelID: '223530104221990912',	//the ChannelID of your Discord chat.
			discordServerID: '100171287267115008',
			sendExtras: false,
		},{
			steamChat: rooms.YCJGTFO,		//the steamid64 for your groupchat
			discordChannelID: '222197821087023104',	//the ChannelID of your Discord chat.
			discordServerID: '215227458285338624',
			sendExtras: true,
		}],
		ignore: ["76561198221679956"]
	} },
	{ name: 'IRCRelay',          type: 'IRCRelay',            options: {
			admins: [users.efreak],
			respectsMute: false,
			defaults: {
				ircOptions: {
					userName: 'Efreak',
					realName: 'https://steam-chat-bot.github.io/node-steam-chat-bot',
				}
			},
			servers: [{
				name: 'Mibbit',
				nickname: 'SteamRelay',
				server: 'irc.mibbit.net',
				performs: [cfg.miley.ircPass,'PRIVMSG Efreak :I\'m logged in!','MODE SteamRelay +B'],
			}],
			relays: [{
				server: 'Mibbit',
				channel: '#EndOfTheInternet',
				steamchat: rooms.YCJGTFO,
				steamchatName: 'YCJGTFO'
			}]
		}
	},
	{ name: 'GithubTrigger',       type: 'GithubTrigger',       options: cfg.githubOptions },
	{ name: 'WebUI',               type: 'WebUI',               options: {
		public: cfg.miley.webUIPublic,
		admins:[users.efreak]
	} },
	{ name: 'stopplaying',         type: 'BotCommandTrigger',   options: { matches: ['!stopplaying'],  exact:true, users:[users.efreak], callback: function(bot,data){bot.setGames([]);}}},
	{ name: 'logInfoTrigger',      type: 'BotCommandTrigger',   options: { matches: ['!log','!logs','logs?'], exact:true, callback: function(bot,data){bot.sendMessage(data.toId,"You can find the complete log for this chat at https://miley.efreakbnc.net/logs/files and you can find a live updating log with 100 lines of history at https://miley.efreakbnc.net/logs/live#room="+data.toId+"&lines=100");}}},
	{ name: 'logTrigger',          type: 'LogTrigger',          options: { roomNames: common.roomNames} }, //no commands.
	{ name: 'InfobotTrigger',      type: 'InfobotTrigger',      options: { admin: [users.efreak] } }, //!learn, !unlearn, !lockword, !unlockword, who/what is/are, !wordinfo
	{ name: 'Notification',        type: 'NotificationTrigger', options: { roomNames: common.roomNames, sendmailArgs:cfg.mailArgs,sendmailPath:cfg.mailPath,address:cfg.fromAddress,banned:globalIgnores}}, //!notification
	{ name: 'ChlorStatusTrigger',  type: 'StatusTrigger',       options: { rooms: rooms.Chlorique, admin: users.chlor} }, //!status(?)
	{ name: 'EternaStatusTrigger', type: 'StatusTrigger',       options: { rooms: rooms.BraveSpirits, admin: users.eterna} }, //!status(?)
	{ name: 'WeatherTrigger',      type: 'WeatherTrigger',      options: { apikey: cfg.wunderkey } },
	{ name: 'JoinRedditGamesTrigger', type: 'BotCommandTrigger',options: { matches: ['!joinrg'], exact:true,callback: function(bot) { bot.joinChat(rooms.rg); setTimeout(function(){bot.sendMessage(rooms.rg,"Someone told me to join, so here I am!")},1000)}}},
	{ name: 'SlipSlotJoinTrigger', type: 'BotCommandTrigger',   options: { users: [users.slipslot,users.lewislol,users.sagit,users.baertel], matches: ['join chats'], exact:true,callback: function(bot) { bot.joinChat(rooms.OPT2);bot.joinChat(rooms.OPT);bot.joinChat(rooms.OPS);bot.joinChat(rooms.OPG);}}},
	{ name: 'SayTrigger',          type: 'SayTrigger',          options: { users: [users.efreak] } }, //!say
	{ name: 'PlayGameTrigger',     type: 'PlayGameTrigger',     options: { users: [users.efreak] } }, //!play
	{ name: 'ModerateTrigger',     type: 'ModerateTrigger',     options: { users: [users.efreak] } }, //!mod
	{ name: 'BanTrigger',          type: 'BanTrigger',          options: { users: [users.efreak] } }, //!ban
	{ name: 'KickTrigger',         type: 'KickTrigger',         options: { users: [users.efreak] } }, //!kick
	{ name: 'UnbanTrigger',        type: 'UnbanTrigger',        options: { users: [users.efreak] } }, //!unban
	{ name: 'BanCheckTrigger',     type: 'BanCheckTrigger',     options: { onjoin: false, ignore: [users.lastbullet,rooms.OPT,rooms.OPT2,rooms.OPS,rooms.OPG]} }, //don't warn when punishedsnake joins, don't warn when people join OP chats (slipslot asked)
	{ name: 'UnmoderateTrigger',   type: 'UnmoderateTrigger',   options: { users: [users.efreak] } }, //!unmod
	{ name: 'UnlockChatTrigger',   type: 'UnlockChatTrigger',   options: { users: [users.efreak] } }, //!unlock
	{ name: 'LockChatTrigger',     type: 'LockChatTrigger',     options: { users: [users.efreak] } }, //!lock
	{ name: 'LeaveChatTrigger',    type: 'LeaveChatTrigger',    options: { users: [users.efreak] } }, //!leave
	{ name: 'SetStatusTrigger',    type: 'SetStatusTrigger',    options: { users: [users.efreak] } }, //!status
	{ name: 'SetNameTrigger',      type: 'SetNameTrigger',      options: { users: [users.efreak] } }, //!name
	{ name: 'JoinChatTrigger',     type: 'JoinChatTrigger',     options: { users: [users.efreak] } }, //!join
	{ name: 'CrockfordTrigger',    type: 'JsonTrigger',         options: { command: "!crock", url:'http://crockfordfacts.org/random.json', parser: function(r,u,t,m,b) { b._sendMessageAfterDelay(t,r); return true;} } },
	{ name: 'BadFanficTrigger',    type: 'JsonTrigger',         options: { command: "!badfic", url:'http://kaction.com/badfanfiction/str_only.php', parser: function(r,u,t,m,b) { b._sendMessageAfterDelay(t,r); return true;} } },
	{ name: 'RemoveFriendTrigger', type: 'RemoveFriendTrigger', options: { users: [users.efreak] } }, //!unfriend
	{ name: 'AddFriendTrigger',    type: 'AddFriendTrigger',    options: { users: [users.efreak] } }, //!friend
	{ name: 'InfoTrigger',         type: 'InfoTrigger',         options: { users: [users.efreak] } }, //!botinfo
	{ name: 'CNJFetcher',          type: 'JsonTrigger',         options: { command: "!norris", url:"http://api.icndb.com/jokes/random",parser:['value','joke'] } },
	{ name: 'RandomGameTrigger',   type: 'RandomGameTrigger'}, //!randomgame
	{ name: 'OMDBTrigger',         type: 'OMDBTrigger' }, //!imdb (or maybe !omdb?)
	{ name: 'KarmaTrigger',        type: 'KarmaTrigger',        options: { }},
	{ name: 'HelpCmd',             type: 'ChatReplyTrigger',    options: { matches: ['!help','!triggers','!cmds','!commands'],
		responses: ['Please view my profile for a list of public commands and other triggers. Not all triggers are allowed in all chats.'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'BugsCmd',             type: 'ChatReplyTrigger',    options: { matches: ['!bug','!bugs','!issue','!feature'],
		responses: ['You can submit bugs and feature requests at https://github.com/Steam-Chat-Bot/node-steam-chat-bot/issues'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'OwnerCmd',            type: 'ChatReplyTrigger',    options: { matches: ['!owner','!efreak'],
		responses: ['My owner is https://steamcommunity.com/profiles/76561198008335925/'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'SourceCmd',           type: 'ChatReplyTrigger',    options: { matches: ['!source','!about'],
		responses: ['This bot is based on node-steam-chat-bot, a wrapper around node-steam, which is a nodejs port of SteamKit2. You can find full source code and some documentation and examples at https://github.com/Steam-Chat-Bot/node-steam-chat-bot'],
		exact: true, probability: 1, timeout: 1000 } },

	{ name: 'AcceptChatInvite',
		type: 'AcceptChatInviteTrigger',
		options: {
			joinAll: [users.efreak], //only efreak can invite the bot to any groupchat
			defaultMessage: "Hello! I'm Efreak's obnoxious chatbot and I'm here to spam you all! :D:", //this message amuses me.
			chatrooms: cfg.miley.chatrooms,
			autoJoinAfterDisconnect: false
		}
	},
	{ name: 'Google',          type: 'GoogleTrigger',          options: { command: '!google' } },	{ name: 'Google2',          type: 'GoogleTrigger',          options: { command: '!g' } },
//	{ name: 'GoogleImages',    type: 'GoogleImagesTrigger',    options: { command: '!image' } },	{ name: 'GoogleImages2',    type: 'GoogleImagesTrigger',    options: { command: '!gi' } },
	{ name: 'EmptyQuoteReply', type: 'ChatReplyTrigger',       options: { matches: ['^'],            responses: ['^'], exact: true, delay: 1000,  ignore: [rooms.Hookups,rooms.OPT,rooms.OPT2,rooms.OPS,rooms.OPG], probability: 0.25, timeout: 30*1000 } },
	{ name: 'PennyDealWithIt', type: 'ChatReplyTrigger',       options: { matches: ['deal with it'], responses: [':dealwithit:'], exact: false, delay: 500, users: [users.penny], rooms: [rooms.OPG], probability: 0.25, timeout: 5*60*1000 } }, 
	{ name: 'GGGDealWithIt',   type: 'ChatReplyTrigger',       options: { matches: ['!dealwithit'],  responses: [':dealwithit:'], exact: true, delay: 500, rooms: [rooms.OPG], probability: 1, timeout: 10*1000 } },
	{ name: 'PingReply',       type: 'ChatReplyTrigger',       options: { matches: ['ping'],         responses: ['pong'], exact: true, delay: 1000, probability: 1, timeout: 30*1000 } },
	{ name: 'EfreakReply',     type: 'ChatReplyTrigger',       options: cfg.replies.efreak },
	{ name: 'HealReply',       type: 'ChatReplyTrigger',       options: cfg.replies.heal },
	{ name: 'HeartReply',      type: 'ChatReplyTrigger',       options: cfg.replies.heart },
	{ name: 'EvalTrigger',     type: 'EvalTrigger',            options: { users: [users.efreak],evalUnsafe:true }},
	{ name: 'SmileReply',      type: 'ChatReplyTrigger',       options: { matches: ['☺',':)'],       responses: ['☹'],delay: 500, probability: 0.3, ignore: [rooms.OPS,rooms.OPT], timeout: 30*60*1000 } },
	{ name: 'FrownReply',      type: 'ChatReplyTrigger',       options: { matches: ['☹',':('],       responses: ['☺'],delay: 500, probability: 0.3, ignore: [rooms.OPS,rooms.OPT], timeout: 30*60*1000 } },
	{ name: 'EmoteReply',      type: 'ChatReplyTrigger',       options: { matches: ['!emote','!emoticon'], responses: [':csgoglobe:',':gasgiant:',':kungfusam:',':starus:',':skull:',':Animal_Instincts:',':moon:',':comet:',':D:',':coolsam:',':Y:',':csgob:',':csgoa:',':csgox:',':grenade:',':Steady_Aim:',':Eagle_Eye:',':Clot:',':reusapple:',':borderlands2:',':medkit:',':health:',':firebaby:',':diwrench:',':diaxe:',':dipaddle:',':redrose:',':questionmark:',':redwizard:',':bladeship:',':sticky:',':twteamred:',':nonmovingship:',':p2chell:',':hurt:',':dglogo:',':Mole:',':berserk:',':Clementine:',':f2_shield:',':BuffaloofLies:',':claygear:',':endregateeth:',':bow:',':alyx:',':f1_egg:',':warband:',':Keys:',':Hands:',':battery:',':Clothes:',':Hank:',':Safe_House:',':died:',':Die:',':oil:',':camel:',':twshield:',':bonus:',':gflower:',':faewing:',':plane:',':yellowwizard:',':postcardb:',':coin:',':pigface:',':fusebomb:',':parts:',':notebook:',':Sasha:',':gambler:',':zombiehead:',':tballed:',':melon:',':greenwizard:',':zombieskull:',':pixeldead:',':power_sub:',':pentak:',':tooth:',':essenceofwater:',':axesword:',':postcardf:',':coop:',':shield:',':medicon:',':advent:',':butterfly:',':squirtooh:',':squirtyay:',':ship:',':squirtmeh:',':agathacross:',':bflower:',':fsshield:',':fsmg:',':fsshot:',':bluewizard:',':orb:',':slothteddy:',':tradingcard:',':tradingcardfoil:',':cashsplash:',':b:',':witch:',':spycon:',':datadisk:',':shield_up:',':check:',':smelltree:',':sadpanda:',':house:',':power_main:',':slime:',':outcast:',':jarhead:',':sfsurprise:',':sfsad:',':medpack:',':reusgreed:'],exact: true, delay: 500, probability: 1, ignore: [rooms.OPS,rooms.OPT], timeout: 2*1000 } },
	{ name: 'GrinReply',       type: 'ChatReplyTrigger',       options: { matches: [':D','ːDː'],     responses: [':D:'], delay: 500, probability: 0.15, ignore: [rooms.BLG,rooms.rg,rooms.OPS,rooms.OPT], timeout: 60*1000 } },
	{ name: 'ThanksReply',     type: 'ChatReplyTrigger',       options: { matches: ['thanks','thx','thank you'], responses: ['yw','you\'re welcome','any time'], delay: 500, probability: 0.15, ignore: [rooms.BLG,rooms.rg,rooms.OPS,rooms.OPT,rooms.OPG], timeout: 30*60*1000 } },
	{ name: 'NameReply',       type: 'ChatReplyTrigger',       options: cfg.replies.miley },
	{ name: 'NameReply2',      type: 'ChatReplyTrigger',       options: cfg.replies.miley2 },
	{ name: 'NotMyName',       type: 'ChatReplyTrigger',       options: cfg.replies.miley3 },
	{ name: 'SteamIDCheck',    type: 'SteamrepTrigger',        options: { command: "!steamrep", delay: 0, timeout: 2*1000 } },
	{ name: 'SingleUserReply', type: 'ChatReplyTrigger',       options: { matches: ['hi bot'], responses: ['hi boss!','hi master!'], exact: true, user: users.efreak,	users: [users.efreak] } },
//	{ name: 'IsUp',            type: 'isupTrigger',            options: { command: '!isup' } },
	{ name: 'MateEscal',       type: 'RegexReplaceTrigger',    options: { match: /^(m+?)(a+?)te(s??)$/, response: '{0}m{1}aaate{2}', delay: 500, ignore: [rooms.BLG,rooms.rg,rooms.OPS,rooms.OPT,rooms.OPG] } },
//	{ name: 'ButtBot',         type: 'ButtBotTrigger',         options: { replacement: 'butt', probability: 0.008, delay: 1000, timeout: 2*60*60*1000, ignore: [rooms.BLG,rooms.OPS,rooms.OPT,rooms.OPG] } },
//	{ name: 'ButtReply',       type: 'ChatReplyTrigger',       options: { matches: ['butt'], responses: ['lol, you said butt'], probability: 0.5, timeout: 2*60*60*1000, delay: 500, ignore: [rooms.BLG,rooms.OPS,rooms.OPT,rooms.OPG] } },
	{ name: 'PenisReply',      type: 'ChatReplyTrigger',       options: { matches: ['penis'], responses: ['lol, you said penis'], probability: 0.15, timeout: 2*60*60*1000, delay: 500, ignore: [rooms.BLG,rooms.OPS,rooms.OPT,rooms.OPG]	} }, //someone wanted this...
	{ name: 'DickReply',       type: 'ChatReplyTrigger',       options: { matches: ['dick'],responses: ['lol, you said dick'],probability: 0.15,timeout: 2*60*60*1000,delay: 500, ignore: [rooms.BLG,rooms.OPS,rooms.OPT,rooms.OPG]	} }, //someone wanted this too...
	{ name: 'PornReply',       type: 'ChatReplyTrigger',       options: { matches: ['porn'], responses: ['I like porn! :D:','69!','lol, you said porn'], probability: 0.5, timeout: 2*60*60*1000, delay: 500, ignore: [rooms.BLG,rooms.OPS,rooms.OPT,rooms.OPG]	} }, //why do you people want this crap?
	{ name: 'RandomReply',     type: 'ChatReplyTrigger',       options: { matches: [], responses: ['ლ(ಠ益ಠლ)', 'щ(ﾟДﾟщ)', 'omg', '(ﾉಥ益ಥ)ﾉ', '¯\\_(ツ)_/¯',' ( ͡° ͜ʖ ͡°)','(╯°□°）╯︵ ┻━┻)','┬─┬ノ( º _ ºノ)',' (ノಠ益ಠ)ノ彡┻━┻','ಠ_ಠ',' ಠ_ರೃ','ಥ_ಥ','⊙▃⊙'], delay: 5*60*1000,probability: 0.05, timeout: 60*60*1000, ignore: [rooms.BLG,rooms.rg,rooms.OPS,rooms.OPT,rooms.OPG] } }, //abusive, watch the timout.
	{ name: 'EfreakEnter',     type: 'MessageOnJoinTrigger',   options: { user: users.efreak, message: "Hello, sexy mama :D:", probability: 1, timeout: 15*60*1000, delay: 1000, ignore: [rooms.BLG,rooms.rg] } },
	{ name: 'HuskyEnter',      type: 'MessageOnJoinTrigger',   options: { user: users.husky, oldmessage: "Huskyclaw is a fucking asshat", message: "I'll love you forever, I'll like you for always, As long as I'm living my baby you'll be. ", probability: 1, delay: 1000, timeout: 60*60*1000, ignore: [rooms.Reddit,rooms.BLG,rooms.rg,rooms.Hookups,rooms.OPS,rooms.OPT,rooms.OPG] } },
	{ name: 'ChipEnter',       type: 'MessageOnJoinTrigger',   options: { user: users.chip, message: "Soggy Chip is disgusting", probability: 1,  delay: 1000,  timeout: 60*60*1000, ignore: [rooms.Reddit,rooms.BLG,rooms.rg,rooms.Hookups,rooms.OPS,rooms.OPT,rooms.OPG] } },
	{ name: 'EmilyEnter',      type: 'MessageOnJoinTrigger',   options: { user: users.emily, message: "Emily <3", probability: 1,  delay: 1000,  timeout: 60*60*1000, ignore: [rooms.Reddit,rooms.BLG,rooms.rg,rooms.Hookups,rooms.OPS,rooms.OPT,rooms.OPG] } },
	{ name: 'NonosEnter',      type: 'MessageOnJoinTrigger',   options: { user: users.nonos, message: "The noseless one is here!",  probability: 1,  delay: 1000,  timeout: 60*60*1000, ignore: [rooms.Reddit,rooms.BLG,rooms.rg,rooms.Hookups,rooms.OPS,rooms.OPT,rooms.OPG] } },
	{ name: 'NormaEnter',      type: 'MessageOnJoinTrigger',   options: { user: users.norma, message: "Norma.jpg ate my family. *cries*",  probability: 1,  delay: 1000,  timeout: 60*60*1000, ignore: [rooms.Reddit,rooms.BLG,rooms.rg,rooms.Hookups,rooms.OPS,rooms.OPT,rooms.OPG] } },
	{ name: 'BoarEnter',       type: 'MessageOnJoinTrigger',   options: { user: users.boar, message: "How aboarable!", probability: 1,  delay: 1000,  timeout: 60*60*1000, ignore: [rooms.Reddit,rooms.BLG,rooms.rg,rooms.Hookups,rooms.OPS,rooms.OPT,rooms.OPG] } },
//wrong id...
//	{ name: 'jcmatrixsEnter',  type: 'MessageOnJoinTrigger',   options: { user: users.boar, message: "Hello, awesome!",  probability: 1,  delay: 1000,  timeout: 60*60*1000, rooms: [rooms.IGB,rooms.OPS,rooms.OPT,rooms.OPG] } },
	{ name: 'EightBall',       type: 'ChatReplyTrigger',       options: { matches: ['!8ball'], responses: ['It is certain','It is decidedly so','Without a doubt','Yes, definitely','You may rely on it','As I see it, yes','Most likely','Outlook good','Yes','Signs point to yes','Reply hazy, try again','Ask again later','Better not tell you now','Cannot predict now','Concentrate and ask again',"Don't count on it",'My sources say no','Outlook not so good','Very doubtful'], timeout: 2*1000, delay: 500, ignore: [rooms.Reddit,rooms.BLG,rooms.OPS,rooms.OPT,rooms.OPG]	} },
	{ name: 'Youtube',         type: 'YoutubeTrigger',         options: { command: '!yt',ignore: [rooms.Reddit],rickrollChance: .05	} },
        { name: 'UD',              type: 'UrbanDictionaryTrigger', options: { command: '!ud', timeout: 1000 } },
	{ name: 'SteamrepOnJoin',  type: 'SteamrepOnJoinTrigger',  options: { ignore: [users.efreak] } },
	{ name: 'MathTrigger',     type: 'MathTrigger',            options: { command:'!calc'} },
	{ name: 'ChooseTrigger',   type: 'ChooseTrigger'},
	{ name: 'RollTrigger',     type: 'RollTrigger'},
	{ name: 'KeyDropTrigger',  type: 'KeyDropTrigger',         options: { users: OPAdmins, room: '103582791432751135'}},
	{ name: 'RedditTrigger',   type: 'RedditTrigger',          options: cfg.redditrepOptions }
]);

miley.express.get('/opglogin', function(req,res) {
	res.redirect(301,"https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.return_to=http%3A%2F%2Fmiley.efreakbnc.net%2Fkeys%2Fverify&openid.realm=http%3A%2F%2Fmiley.efreakbnc.net%2Fkeys");
}); //seems like the openid implementation stores stuff in the global scope when it shouldn't

miley.onLogon = function(that){
	that.setGames(gamesList);
	that.unmute();
	delayedJoin(miley,rooms.Chlorique,2500,3); //chlorique
	delayedJoin(miley,rooms.DLCG,2500,3); //dlcgiveaways
	delayedJoin(miley,rooms.Reddit,2500,3); //one of the reddit chats
	delayedJoin(miley,rooms.OPS,2500,3); //Opium Pulses Savings
	delayedJoin(miley,rooms.OPT,2500,3); //OpiumPulsesTrading
	delayedJoin(miley,rooms.OPG,2500,3); //OpiumPulsesGiveaways
	delayedJoin(miley,rooms.BLG,2500,3); //backlog gaming
	delayedJoin(miley,rooms.rg,2500,3); //reddit games
	delayedJoin(miley,rooms.YCJGTFO,2500,3); //ycjgtfo
	delayedJoin(miley,rooms.Freaktopia,2500,3); //freaktopia
	delayedJoin(miley,rooms.Hookups,2500,3); //hookups
	delayedJoin(miley,rooms.Reddit,2500,3); //reddit
	delayedJoin(miley,rooms.OPT2,2500,3); //OP Trading Revolution
	delayedJoin(miley,rooms.botDev,2500,3); //chatbot testing etc
}
miley.connect();








/*
var triviagamesList = [221410];//,218800];
var triviagamesListMuted = [];
var triviaAdmins = [users.efreak,users.grizzly,users.nasty];
var poonicorn = new ChatBot(cfg.poo.username,cfg.poo.password, {
	guardCode: '69Q7C',
	logFile: true,
	autoReconnect: true,
	autojoinFile: cfg.poo.autojoinFile,
	steamapikey: cfg.steamapikey,
	babysitTimer: 300000,
//	sentryFile: cfg.poo.sentryFile,
	logLevel: logLevel,
	consoleLogLevel: logLevel,
	webServerPort: cfg.poo.webServerPort,
	ignores: globalIgnores
});
var pooChats = {};
pooChats[rooms.tknights] = cfg.inviteMsg;
poonicorn.addTriggers([
	{
		name: 'MuteCommand',
		type: 'BotCommandTrigger',
		options: {
			matches: ['!mute','!stfu','!pause','!sleep'],
			exact: true,
			users: triviaAdmins,
			callback: function(bot) { bot.mute(); bot.setPrimaryGame(218800,250); }
		}
	},
	{
		name: 'UnmuteCommand',
		type: 'BotCommandTrigger',
		options: {
			matches: ['!unmute', '!unpause','!wakeup'],
			exact: true,
			users: triviaAdmins,
			callback: function(bot) { bot.unmute(); bot.setGames(triviagamesList); bot.setPrimaryGame(221410,250);}
		}
	},
	{ name: "AcceptChatInvite",
		type: "AcceptChatInviteTrigger",
		options: {
			chatrooms: pooChats,
			joinAll: [users.efreak], //only efreak can invite the bot to other groupchats
			autoJoinAfterDisconnect: true
		}
	},
	{ name: 'WebUI',               type: 'WebUI',                 options: {
		public: cfg.poo.webUIPublic,
		admins:[users.efreak]
	} },
	{ name: 'KarmaTrigger',        type: 'KarmaTrigger',        options: { }},
	{ name: 'logInfoTrigger',      type: 'BotCommandTrigger',   options: { matches: ['!log','!logs','logs?'], exact:true, callback: function(bot,data){bot.sendMessage(data.toId,"Live log is available at https://trivia.efreakbnc.net/logs/live#room=103582791438401769&lines=100 Lines show up immediately, as soon as the bot sees them. A complete history is at https://trivia.efreakbnc.net/logs/g-Trivia%20Knights.txt");}}},
	{ name: 'logTrigger',          type: 'LogTrigger',          options: { roomNames: common.roomNames, pingTimer:5000} },
	{ name: 'TriviaTrigger',       type: 'TriviaTrigger',          options: { command: '!trivia', rooms:[rooms.tknights], admins: triviaAdmins}},
	{ name: 'stopplaying',         type: 'BotCommandTrigger',   options: { matches: ['!stopplaying'],  exact:true, users:triviaAdmins, callback: function(bot,data){bot.setGames([]);}}},
	{ name: 'startplaying',        type: 'BotCommandTrigger',   options: { matches: ['!startplaying'], exact:true, users:triviaAdmins, callback: function(bot,data){bot.setGames(triviagamesList);}}},
	{ name: 'EfreakInfobotFakeReply',     type: 'ChatReplyTrigger',       options: { matches: ['learn efreak'], responses: ["I'm sorry, I can't do that for you!"], exact: false, delay: 1000, probability: 1, timeout: 100 ,ignore: [users.efreak] } },
	{ name: 'InfobotTrigger',      type: 'InfobotTrigger',      options: { admin: triviaAdmins, userlearn:false } },
	{ name: 'Notification',        type: 'NotificationTrigger', options: { roomNames: common.roomNames, sendmailArgs:cfg.mailArgs,sendmailPath:cfg.mailPath,address:cfg.fromAddress,banned:globalIgnores}}, //!notification
	{ name: 'JoinTKTrigger',       type: 'BotCommandTrigger',   options: { matches: ['!jointk','!join'], exact:true,callback: function(bot) { bot.joinChat(rooms.tknights); setTimeout(function(){bot.sendMessage(rooms.tknights,"Someone told me to join, so here I am!")},1000)}}},
	{ name: 'SayTrigger',          type: 'SayTrigger',          options: { users: triviaAdmins } },
	{ name: 'PlayGameTrigger',     type: 'PlayGameTrigger',     options: { users: triviaAdmins } },
	{ name: 'ModerateTrigger',     type: 'ModerateTrigger',     options: { users: triviaAdmins } },
	{ name: 'BanTrigger',          type: 'BanTrigger',          options: { users: triviaAdmins } },
	{ name: 'KickTrigger',         type: 'KickTrigger',         options: { users: triviaAdmins } },
	{ name: 'UnbanTrigger',        type: 'UnbanTrigger',        options: { users: triviaAdmins } },
	{ name: 'UnmoderateTrigger',   type: 'UnmoderateTrigger',   options: { users: triviaAdmins } },
	{ name: 'UnlockChatTrigger',   type: 'UnlockChatTrigger',   options: { users: triviaAdmins } },
	{ name: 'LockChatTrigger',     type: 'LockChatTrigger',     options: { users: triviaAdmins } },
	{ name: 'LeaveChatTrigger',    type: 'LeaveChatTrigger',    options: { users: triviaAdmins } },
	{ name: 'SetStatusTrigger',    type: 'SetStatusTrigger',    options: { users: triviaAdmins } },
	{ name: 'SetNameTrigger',      type: 'SetNameTrigger',      options: { users: triviaAdmins } },
	{ name: 'JoinChatTrigger',     type: 'JoinChatTrigger',     options: { users: triviaAdmins } },
	{ name: 'EvalTrigger',         type: 'EvalTrigger',         options: { users: [users.efreak],evalUnsafe:true }},
	{ name: 'RemoveFriendTrigger', type: 'RemoveFriendTrigger', options: { users: triviaAdmins } },
	{ name: 'AddFriendTrigger',    type: 'AddFriendTrigger',    options: { users: triviaAdmins } },
	{ name: 'InfoTrigger',         type: 'InfoTrigger',         options: {} },
	{ name: 'CNJFetcher',          type: 'JsonTrigger',         options: { command: "!norris", url:"http://api.icndb.com/jokes/random",parser:['value','joke'] } },
	{ name: 'RandomGameTrigger',   type: 'RandomGameTrigger'},
	{ name: 'OMDBTrigger',         type: 'OMDBTrigger' },
	{ name: 'ReloadTriggers',      type: 'BotCommandTrigger',   options: { matches: ['!reload'],   exact: true, callback: function(bot) { var triggerDetails = bot.getTriggerDetails(); bot.clearTriggers(); bot.addTriggers(triggerDetails); } } },
	{ name: 'HelpCmd',             type: 'ChatReplyTrigger',    options: { matches: ['!help','!triggers','!cmds','!commands'],
		responses: ['Please view my profile for a list of publicly commands and other triggers. Not all triggers are allowed in all chats.'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'BugsCmd',             type: 'ChatReplyTrigger',    options: { matches: ['!bug','!bugs','!issue','!feature'],
		responses: ['You can submit bugs and feature requests at https://github.com/Steam-Chat-Bot/node-steam-chat-bot/issues'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'OwnerCmd',            type: 'ChatReplyTrigger',    options: { matches: ['!owner','!efreak'],
		responses: ['My owner is Efreak - https://steamcommunity.com/profiles/76561198008335925/'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'SourceCmd',           type: 'ChatReplyTrigger',    options: { matches: ['!source','!about'],
		responses: ['This bot is based on node-steam-chat-bot. You can find full source code and some documentation and examples at https://github.com/Steam-Chat-Bot/node-steam-chat-bot'],
		exact: true, probability: 1, timeout: 1000 } },
	{ name: 'Google',          type: 'GoogleTrigger',          options: { command: '!g' } },	{ name: 'Google2',         type: 'GoogleTrigger',          options: { command: '!google' } },
//	{ name: 'GoogleImages',    type: 'GoogleImagesTrigger',    options: { command: '!gi' } },	{ name: 'GoogleImages2',   type: 'GoogleImagesTrigger',    options: { command: '!image' } },
//	{ name: 'EmptyQuoteReply', type: 'ChatReplyTrigger',       options: { matches: ['^'],            responses: ['^'], exact: true, delay: 1000,  ignore: [rooms.Hookups,rooms.OPS,rooms.OPT,rooms.OPG], probability: 0.25, timeout: 30*1000 } },
	{ name: 'PingReply',       type: 'ChatReplyTrigger',       options: { matches: ['ping'],         responses: ['pong'], exact: true, delay: 1000, probability: 1, timeout: 30*1000 } },
	{ name: 'EfreakReply',     type: 'ChatReplyTrigger',       options: { matches: ['Efreak','Efreak?','efreak','efreak?','efreak?','Efreak?'], responses: ['Efreak is master!'], exact: true, delay: 1000, probability: 0.5, timeout: 60*60*1000 ,ignore: [rooms.BLG] } },
	{ name: 'SteamIDCheck',    type: 'SteamrepTrigger',        options: { command: "!steamrep", delay: 0, timeout: 2*1000 } },
	{ name: 'SingleUserReply', type: 'ChatReplyTrigger',       options: { matches: ['hi bot'], responses: ['hi boss!','hi master!'], exact: true, user: users.efreak,	users: triviaAdmins } },
	{ name: 'EfreakEnter',     type: 'MessageOnJoinTrigger',   options: { user: users.efreak,  message: "JOY! Efreak is here!", probability: 1, delay: 1000, timeout: 60*60*1000 } },
	{ name: 'NastyEnter',      type: 'MessageOnJoinTrigger',   options: { user: users.nasty,   message: "Yuck!",                probability: 1, delay: 1000, timeout: 60*60*1000 } },
	{ name: 'GrizzlyEnter',    type: 'MessageOnJoinTrigger',   options: { user: users.grizzly, message: "ROAR!",                probability: 1, delay: 1000, timeout: 60*60*1000 } },
	{ name: 'EightBall',       type: 'ChatReplyTrigger',       options: { matches: ['!8ball'], responses: ['It is certain','It is decidedly so','Without a doubt','Yes, definitely','You may rely on it','As I see it, yes','Most likely','Outlook good','Yes','Signs point to yes','Reply hazy, try again','Ask again later','Better not tell you now','Cannot predict now','Concentrate and ask again',"Don't count on it",'My sources say no','Outlook not so good','Very doubtful'], timeout: 2*1000, delay: 500, ignore: [rooms.Reddit,rooms.BLG,rooms.OPS,rooms.OPT,rooms.OPG]	} },
        { name: 'UD',              type: 'UrbanDictionaryTrigger', options: { command: '!ud', timeout: 1000 } },
]);

poonicorn.onLogon = function(that){
	that.setGames(triviagamesList);
	that.unmute();
}
poonicorn.connect();
*/
