[![GitHub version](https://badge.fury.io/gh/efreak%2Fnode-steam-chat-bot.svg)](http://badge.fury.io/gh/efreak%2Fnode-steam-chat-bot)
[![GitHub tag](https://img.shields.io/github/tag/efreak/node-steam-chat-bot.svg)]()
[![node](https://img.shields.io/node/v/steam-chat-bot.svg)]()
[![Repo Size](https://reposs.herokuapp.com/?path=Efreak/node-steam-chat-bot)]()
[![Packagist](https://img.shields.io/badge/license-MIT-44CC11.svg)](/LICENCE)

[![Dependencies](https://david-dm.org/efreak/node-steam-chat-bot.svg)](https://david-dm.org/efreak/node-steam-chat-bot)
[![Dependency Status](https://www.versioneye.com/user/projects/547014ce9dcf6d5567000b49/badge.svg?style=flat)](https://www.versioneye.com/user/projects/547014ce9dcf6d5567000b49)
[![Codacy Badge](https://www.codacy.com/project/badge/79e3862b9b2b4e0fbbcf9e980fcb6263)](https://www.codacy.com/public/efreak2004/node-steam-chat-bot)

[![NPM](https://nodei.co/npm/steam-chat-bot.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/steam-chat-bot/)

node-steam-chat-bot
===================

Simplified interface for a steam chat bot. This is a wrapper around [Steam for Node.js](https://github.com/seishun/node-steam) which is aimed at making an easily configurable chatbot that sits in Steam groups chat rooms and responds to various events. Responses are handled as a set of triggers of various types which can be configured to respond to a number of different chat messages. Steam requires that a user has at least one game before it can join chat rooms (unless it's a mod), so you'll need to buy a game for the bot account or make it a mod before it will be able to join.

If you have Steam Guard enabled you'll get a failed logon attempt the first time you try to log on and you'll be sent a Steam Guard code. Pass this code in with the constructor (below) and you should be able to log in. A sentry file will be stored, which should allow you to log in with a different computer using the same guard code. If you start getting logon failures again you should delete the sentry file, remove the guard code, and try to log in with neither so you get a fresh code emailed to you.

````javascript
new ChatBot('username', 'password', {
	guardCode: 'XXXX', //this is required on the first run if you have steamguard enabled, but not after that.
	disableWebServer:false, //the built-in webserver is enabled by default
	webServerPort: 8080, //If you run steam-chat-bot as root, it will eat your babies. Do NOT run steam-chat-bot as root.
	autojoinFile: "bot.username.autojoin",
	consoleColors:true,
	consoleTime:true,
	consoleLogLevel:"info", //can also be error or debug
	logFile: "bot.username.log", //this does *not* log chatter. If you want to log chatter, use the logTrigger.
	sentryFile: "bot.username.sentry", //this is your ssfn file (no, you can't actually use an ssfn file)
	autoconnect: true, //Why would you *not* want it to autoconnect?
	autoReconnect: false, //You probably want to set this to true, though...
	babysitTimer: 5*60*1000 //that's 5 minutes, if you can't do math. The babysitter checks to make sure we're online if above is true.
})
````

### Installation: 

Type `npm install steam-chat-bot`. If you want to run the development version, type `npm install efreak/node-steam-chat-bot#development` (or the url to your preferred repo/branch).

To get this running in Windows you'll need to follow the setup instructions for [node-gyp](https://github.com/TooTallNate/node-gyp#installation) and also use a branch of libxmljs as described in [this issue](https://github.com/polotek/libxmljs/issues/176) (TLDR is to run 'npm install polotek/libxmljs#vendor-src' before 'npm install').

### Current Triggers:


`AcceptChatInviteTrigger` - Joins a specified chatroom when invited and says an optional welcome message. set option autoJoinAfterDisconnect to add channels to autojoin list when used.

`AcceptFriendRequestTrigger` - Automatically accepts any friend requests sent to the bot.

`AddFriendTrigger` - provides a !add command. You should probably restrict this and other similar commands to admin user(s) only.

`BanCheckTrigger` - checks to see if a user has any VAC/economy/community bans via steam API. Requires a steam api key, defined as option apikey in the plugin, or globally defined as a chatBot option steamapikey

`BanTrigger` - bans a user from a groupchat. User does not need to be in groupchat for this to work.

`BotCommandTrigger` - Runs a specified callback when a specific command message is typed.

`ButtBotTrigger` - Repeats a message, but with one word randomly replaced with a specific other word. The canonical example is replacing a random word with "butt".

`ChatPmTrigger` - Responds to certain messages via private message.

`ChatReplyTrigger` - Detects a message (either an exact match or a "contains" match) and replies with a specified message.

`CleverbotTrigger` - Uses cleverbot to reply to a message, optionally only when a specific word is mentioned.

`DoormatTrigger` - Sends a message ("Hello username") to someone when they join the chat.

`GoogleTrigger` - Prints out the title and link of the first search result on Google.

`GoogleImagesTrigger` - Prints a link to the first search result on Google Images.

`IsUpTrigger` - Checks to see if a webserver is running (looks for 200, 301, 302 status)

`InfoTrigger` - Provides information about the status of the bot (amount of time it was running, operating system, etc)

`JoinChatTrigger` - tells the bot to join a groupchat, and announce who sent it

`KickTrigger` - tells the box to kick someone from a groupchat.

`LeaveChatTrigger` - tells the bot to leave a groupchat, announcing who commanded it

`LinkName` - Is given a link and sends the title of the website.

`LockChatTrigger` - tells the bot to lock a groupchat.

`MemeBotTrigger` - Adds ">" before a message it will send

`MessageOnJoinTrigger` - tells the bot to welcome a specific user with an message every time they join a chat the user is in. Recommended not to use too much, and to set a long timeout to prevent abuse.

`ModerateTrigger` - tells the bot to set the groupchat to be moderated.

`MoneyTrigger` - Converts between currencies, will require an `apikey` from https://openexchangerates.org

`OMDBTrigger` - Searches IMDB for  a specified movie. Can accept an optional year parameter (ex: !movie aliens 1986). If one is not provided, it will return the first result without the year.

`PlayGameTrigger` - tells the bot to play a game. You need to send the game's appid. - options allowpublic and allowprivate (both true by default) allow you to restrict usage of this command to either private or groupchat messages.

`PlayTrigger` - same as above. Not sure why I have two of this plugin; one or the other may not work.

`ProfileCheckTrigger` - When a user joins, look up their profile in steam API and if they have a private profile, or never bothered to set one up, announce it to the groupchat. Optional option: apikey can be defined in options, overriding any steamapikey can be defined in the bot constructor. If neither is defined, it won't be used (not required).

`RandomGameTrigger` - Default command !randomgame. When command is used, it will check the user's games list (or that of the given steamid64, if one is placed after the command) and return a random game, along with a steam:// link to launch it, and the amount of time spent in that game. Requires apikey in options, or steamapikey in bot constructor.

`RedditOnJoinTrigger` - When a user joins a groupchat, check a (currently private) Reddit API to fetch information on the user for /r/SteamGameSwap (ban status, flair level, username, etc) and greet them with it.

`RedditTrigger` - Check reddit flair/bans/username on command. Takes /u/username, steamid64, or full profile urls for steam or reddit. If no input, returns information for the calling user.

`RegexReplaceTrigger` - Detects a regex match in a message and uses the matches to construct a reply.

`RemoveFriendTrigger` - tells the bot to delete a friend.

`RollTrigger` - tells the bot to roll dice. Can get very spammy. Can be easily abused to make the bot crash. If you want to use, recommended you set a limit on the number/size of dice rolled (please submit pull request if you do this).

`SayTrigger` - tells the bot to say something in another groupchat.

`SetNameTrigger` - changes the bot's display/profile name.

`SetStatusTrigger` - changes the bot's status between online, away, snooze, etc. - options: statuses {online,busy,away,snooze,trade,play,offline}.

`SteamrepOnJoinTrigger` - checks steamrep API whenever someone joins a chat the bot is in. If Steamrep lists the user as a scammer, then bot announces it and gives links for more info.

`SteamrepTrigger` - same as `SteamrepOnJoinTrigger`, but provides a command rather than automatic onjoin check.

`TranslateTrigger` - uses http://hablaa.com/api to translate. Define a `translatecommand` (command used to do translating) and a `languagescommand` (command used to print language codes), or leave as default. Usage is `!translate <word> <start language> <end language>` to translate, `!languages` for a list of language codes (sent via private message), and `!languages <code>` to see what language does with that code.

`TumblrTrigger` - Allows the bot to post things to a tumblr blog, either by commands (!postphoto, !postquote, !posttext, !postlink, !postchat, !postaudio, !postvideo), or by monitoring the chatrooms the bot is in for links. You will need to register an app here: http://www.tumblr.com/oauth/apps and follow these instructions to get the keys: https://groups.google.com/d/msg/tumblr-api/gz8Zv-Mhex4/8-eACnkArkgJ.

`UnbanTrigger` - unbans a user from a groupchat.

`UnlockTrigger` - unlocks a groupchat.

`UnmoderateTrigger` - unmoderates a groupchat.

`UrbanDictionaryTrigger` - Queries Urban Dictionary for the first definition of a word, then pastes it into chat.

`WikiBotTrigger` - Posts to igbwiki.com. See [wikiBotTrigger.js](https://github.com/Efreak/node-steam-chat-bot/blob/master/lib/triggers/wikiBotTrigger.js) to see how to customize it.

`WolframAlphaTrigger` - Queries Wolfram Alpha if a message starts with a specified command. This only displays a textual representation of the primary result (if it exists) so it's not always a good answer. You will need an appId from http://products.wolframalpha.com/api/.

`YoutubeTrigger` - Will respond to a Youtube search term, whether it be a video or a channel (1st result, will be automatic). This will require an API key (not OAUTH token) from Google. This can be found here: https://console.developers.google.com (create a project, and generate an API key, if you need extra help google it) and defined as `apikey: <key>`.

### Universal properties that work on *all* triggers (defined in BaseTrigger)

`delay` - number - delay in ms between when the response is processed and when it's actually sent to the steam servers.

`probability` - 0-1 - what is the likelyhood that the command will occur? Random number generated before any other checks must be less than this. Defaults to 1.

`timeout` - number - how long in ms is a trigger disabled for before it can be used again.

`respectsFilters` - bool - intended to be used internally, to override filters (as defined below)

`ignore` - ['steamid64','steamid64'] - this filter is an array of steamid64s of users that this command will not work for, as well as groups this command cannot be used in. If a user or a groupchat matches any element, trigger will not be allowed to proceed.

`user` - ['steamid64','steamid64'] - this filter is an array of whitelisted steamid64s of users that are allowed to use this command or groupchats that are allowed to use this command. If the steamid64 matches any elements, or if this array is not defined, trigger will be allowed to proceed (to the next filter, at least).

`rooms` - ['steamid64','steamid64'] - this filter is an array of whitelisted steamid64s of groupchats for a trigger. If the steamid64 matches any elements, or if this array is not defined, trigger will be allowed to proceed (to the next filter, at least).

`command` - "!string" - this isn't universal, however many triggers allow you to change the default command using this option.


See [example.js](https://github.com/efreak/node-steam-chat-bot/blob/master/example.js) for an example usage.

### Heroku

See the bottom of example-heroku.js for an example of a simple webserver and self-pinger that satisfies heroku's requirements of 1 visit per hour to keep a free Dyno running. It also provides some simple statistics when you visit the /stats url. Read the top of the file to set it up correctly with heroku.

After you have example-heroku set up to your liking, follow the instructions [here](https://devcenter.heroku.com/articles/git) to set up heroku and upload your bot. Once it's uploaded, start it with `heroku ps:scale web=1`

### Testing Policy : [![forthebadge](http://forthebadge.com/images/badges/fuck-it-ship-it.svg)](http://forthebadge.com)

In other words, I don't do a whole lot of testing. I do my best not to break things, but *stuff happens*. If you [found](https://github.com/Efreak/node-steam-chat-bot/issues/new) or [fixed](https://github.com/Efreak/node-steam-chat-bot/compare/) a bug, you know what to do...
