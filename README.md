[![GitHub version](https://img.shields.io/github/release/Steam-Chat-Bot/node-steam-chat-bot.svg?label=ver)](https://github.com/Steam-Chat-Bot/node-steam-chat-bot/releases/latest)
[![GitHub tag](https://img.shields.io/github/tag/Steam-Chat-Bot/node-steam-chat-bot.svg)](https://github.com/Steam-Chat-Bot/node-steam-chat-bot/tags/latest)
[![node](https://img.shields.io/node/v/steam-chat-bot.svg)](https://npmjs.com/package/steam-chat-bot)
[![Repo Size](https://reposs.herokuapp.com/?path=Steam-Chat-Bot/node-steam-chat-bot)]()
[![License](https://img.shields.io/badge/license-MIT-44CC11.svg)](https://efreak.mit-license.org)

[![Join the chat at https://gitter.im/Efreak/node-steam-chat-bot](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Efreak/node-steam-chat-bot?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Dependency Status](https://www.versioneye.com/user/projects/547014ce9dcf6d5567000b49/badge.svg?style=flat)](https://www.versioneye.com/user/projects/547014ce9dcf6d5567000b49)
[![Codacy Badge](https://img.shields.io/codacy/79e3862b9b2b4e0fbbcf9e980fcb6263.svg)](https://www.codacy.com/public/efreak2004/node-steam-chat-bot)
[![Downloads per month](https://img.shields.io/npm/dm/steam-chat-bot.svg?label=DLs)](https://npmjs.com/package/steam-chat-bot)

[![Stats](https://nodei.co/npm/steam-chat-bot.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/steam-chat-bot/)
[![Downloads](https://nodei.co/npm-dl/steam-chat-bot.png?months=6&height=2)](https://nodei.co/npm/steam-chat-bot/)

# steam-chat-bot

This module is based on the original steam-chat-bot written by [bonnici](https://github.com/bonnici). The original module link is [here](https://github.com/bonnici/node-steam-chat-bot).

Simplified interface for a steam chat bot. This is a wrapper around [Steam for Node.js](https://github.com/seishun/node-steam) which is aimed at making an easily configurable chatbot that sits in Steam groups chat rooms and responds to various events. Responses are handled as a set of triggers of various types which can be configured to respond to a number of different chat messages. Steam requires that a user has at least one game before it can join chat rooms (unless it's a mod), so you'll need to buy a game for the bot account or make it a mod before it will be able to join.

If you have Steam Guard enabled you'll get a failed logon attempt the first time you try to log on and you'll be sent a Steam Guard code. Pass this code in with the constructor (below)` and you should be able to log in. A sentry file will be stored, which should allow you to log in with a different computer using the same guard code. If you start getting logon failures again you should delete the sentry file, remove the guard code, and try to log in with neither so you get a fresh code emailed to you.

We also have our very own [subreddit](http://reddit.com/r/NodeSteamChatBot). If you like steam-chat-bot, please subscribe to it. We often post news, and other important information. It is also a place for users to get help if something doesn't work.
### Installation:

Type `npm install steam-chat-bot`. If you want to run the development version, type `npm install efreak/node-steam-chat-bot#development` (or the url to your preferred repo/branch).

To get this running in Windows you'll need to follow the setup instructions for [node-gyp](https://github.com/TooTallNate/node-gyp#installation) and also use a branch of libxmljs as described in [this issue](https://github.com/polotek/libxmljs/issues/176) (TLDR is to run 'npm install polotek/libxmljs#vendor-src' before 'npm install').

### Configuration:

#### Basic Config:

You almost certainly want more than this in your config, unless you're happy with all the defaults and only having a logTrigger.

```javascript
var myBot = new ChatBot('username', 'password');
myBot.loadTriggers([
	{
		name: 'logTrigger',
		type: 'LogTrigger',
		options: { roomNames: roomNames }
	}
]);
```

There are also several example configurations in the [examples folder](https://github.com/Steam-Chat-Bot/node-steam-chat-bot/tree/master/examples).

If there is no example configuration for a specified trigger, please check the top of the trigger file for information on calling it. The trigger definition files may also have information on more advanced usage than is contained in the readme or wiki or example configs.

### Public Functions

There are some public functions available for more advanced/programmatic usage of the bot.

- `chatBot.onLogon(function(bot){code()}` - execute code() whenever the bot logs on. You can use this to send yourself a notification whenever the bot logs on, or do pretty much anything else without actually writing a trigger for it.
- `chatBot.redirect(source,destination,code)` - set up a web redirect for the bot. You may wish to use this to, say, redirect /help to the bot's website.
- `chatBot.addTrigger(triggerDefinition)` - add a single trigger to the bot.
- `chatBot.addTriggers(triggerDefinitionArray)` - add an array of triggers to the bot.
- `chatBot.clearTriggers()` - remove all triggers from the bot. Note that poorly behaved triggers may not be completely removed if they modify other parts of the bot.

### Popular Triggers:

See [TRIGGERS](TRIGGERS) or the triggers folder for the full list of triggers and how
to use them. If you want to contribute a trigger, please make sure to add a quick description and list of all parameters and how to use them at the
top of the trigger file (required) and add a basic usage section to [TRIGGERS](TRIGGERS) (also required, need not be in-depth).

#### Management Triggers

General bot-related and chat-related functions.

- `AddFriendTrigger` - Tell the bot to send a friend request.
- `InfoTrigger` - Provides information about the status of the bot
- `BanTrigger` - bans a user from a groupchat. They do not need to be in chat.
- `DoormatTrigger` - Sends a message ("Hello username") to someone when they join the chat.
- `MessageOnJoinTrigger` - tells the bot to welcome a specific user with an message
- `SayTrigger` - tells the bot to say something
- `SetNameTrigger` - changes the bot's name.
- `PlayGameTrigger` - tells the bot to play a game. You need to send the game's appid. - options allowpublic and allowprivate (both true by default) allow you to restrict usage of this command to either private or groupchat messages.
- `PlayTrigger` - same as above. Not sure why I have two of this plugin; one or the other may not work.
- `LogTrigger` - Uses the built-in webserver to server logs in realtime via the browser. Also serves archives.

#### Trade-related triggers

- `BanCheckTrigger` - checks to see if a user has any VAC/economy/community bans via steam API. Requires a steam api key, defined as option apikey in the plugin, or globally defined as a chatBot option steamapikey
- `BitcoinTrigger` - does various actions over the BTC network
- `ProfileCheckTrigger` - When a user joins, look up their profile in steam API and if they have a private profile, or never bothered to set one up, announce it to the groupchat. Optional option: apikey can be defined in options, overriding any steamapikey can be defined in the bot constructor. If neither is defined, it won't be used (not required).
- `RedditTrigger` - Check reddit flair/bans/username on command. Requires access to the /r/SGS API. Note: I will not help you with gaining access to the API, and everything I know about the API is used in this trigger.
- `SteamrepTrigger` - checks steamrep API on command. If Steamrep lists the user as a scammer, then bot announces it and gives links for more info. See `SteamrepOnJoinTrigger` to do this whenever someone joins a chat.
- `MoneyTrigger` - Converts between currencies, will require an `apikey` from https://openexchangerates.org

#### Other popular triggers

- `BotCommandTrigger` - Runs a specified callback when a specific command message is typed.
- `CSGOStatsTrigger` - Retrieves a player's csgo stats from steam api
- `ChatReplyTrigger` - Detects a message (either an exact match or a "contains" match) and replies with a specified message.
- `CleverbotTrigger` - Uses cleverbot to reply to a message, optionally only when a specific word is mentioned.
- `GoogleTrigger` - Prints out the title and link of the first search result on Google.
- `LinkNameTrigger` - Is given a link and sends the title of the website.
- `OMDBTrigger` - Searches IMDB for  a specified movie.
- `RandomGameTrigger` - Picks a random game from the calling user's games list, or that of any specified user with an open profile.
- `RegexReplaceTrigger` - Detects a regex match in a message and uses the matches to construct a reply.
- `SteamIDTrigger` - Converts someone's name to a SteamID
- `TranslateTrigger` - Translates between languages using hablaa.
- `TumblrTrigger` - Allows the bot to post things to a tumblr blog, either by commands, or by monitoring the chatrooms the bot is in for links.
- `WolframAlphaTrigger` - Queries Wolfram Alpha. You will need an appId from http://products.wolframalpha.com/api/.
- `YoutubeTrigger` - Will respond to a Youtube search term, whether it be a video or a channel.

### Writing Triggers

If you look at BaseTrigger.js, you can see a full list of available functions designed to be used from within plugins. You can also use a chatBot.js function() by calling this.chatBot.function() object from inside a trigger. Please see the Wiki for more information.

### Heroku

See the bottom of example-heroku.js for an example of a simple webserver and self-pinger that satisfies heroku's requirements of 1 visit per hour to keep a free Dyno running. It also provides some simple statistics when you visit the /stats url. Read the top of the file to set it up correctly with heroku.

After you have example-heroku set up to your liking, follow the instructions [here](https://devcenter.heroku.com/articles/git) to set up heroku and upload your bot. Once it's uploaded, start it with `heroku ps:scale web=1`

### Testing Policy: [![forthebadge](http://forthebadge.com/images/badges/fuck-it-ship-it.svg)](http://forthebadge.com "Because we care™")

In other words, I don't do a whole lot of testing. I do my best not to break things, but *stuff happens*. If you [found](https://github.com/Steam-Chat-Bot/node-steam-chat-bot/issues/new) or [fixed](https://github.com/Steam-Chat-Bot/node-steam-chat-bot/compare/) a bug, you know what to do.

Note: Please read about [CONTRIBUTING](CONTRIBUTING) before creating a pull request. If your pull request goes against what is said, it will not be accepted and we will ask you to fix it. 
