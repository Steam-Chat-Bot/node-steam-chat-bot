node-steam-chat-bot
===================

Simplified interface for a steam chat bot. This is a wrapper around [Steam for Node.js](https://github.com/seishun/node-steam) which is aimed at making an easily configurable chatbot that sits in Steam groups chat rooms and responds to various events. Responses are handled as a set of triggers of various types which can be configured to respond to a number of different chat messages. Steam requires that a user has at least one game before it can join chat rooms (unless it's a mod), so you'll need to buy a game for the bot account or make it a mod before it will be able to join.

If you have Steam Guard enabled you'll get a failed logon attempt the first time you try to log on and you'll be sent a Steam Guard code. Pass this code in with the constructor (e.g. `new ChatBot('username', 'password', { guardCode: 'XXXX' };)` and you should be able to log in. A sentry file will be stored, which should allow you to log in with a different computer using the same guard code but I've honestly never tried this so ¯\\_(ツ)_/¯. If you start getting logon failures again you should delete the sentry file, remove the guard code, and try to log in with neither so you get a fresh code emailed to you.

### Current Triggers:


`AcceptChatInviteTrigger` - Joins a specified chatroom when invited and says an optional welcome message. set option autoJoinAfterDisconnect to add channels to autojoin list when used.

`AcceptFriendRequestTrigger` - Automatically accepts any friend requests sent to the bot.

`AddFriendTrigger` - provides a !add command. You should probably restrict this and other similar commands to admin user(s) only.

`BanCheckTrigger` - checks to see if a user has any VAC/economy/community bans via steam API. Requires a steam api key, defined as option apikey in the plugin, or globally defined as a chatBot option steamapikey

`BanTrigger` - bans a user from a groupchat. User does not need to be in groupchat for this to work.

`BotCommandTrigger` - Runs a specified callback when a specific command message is typed.

`ButtBotTrigger` - Repeats a message, but with one word randomly replaced with a specific other word. The canonical example is replacing a random word with "butt".

`ChatReplyTrigger` - Detects a message (either an exact match or a "contains" match) and replies with a specified message.

`CleverbotTrigger` - Uses cleverbot to reply to a message, optionally only when a specific word is mentioned.

`GoogleTrigger` - Prints out the title and link of the first search result on Google.

`GoogleImagesTrigger` - Prints a link to the first search result on Google Images.

`IsUpTrigger` - Checks to see if a webserver is running (looks for 200, 301, 302 status)

`JoinChatTrigger` - tells the bot to join a groupchat, and announce who sent it

`KickTrigger` - tells the box to kick someone from a groupchat.

`LeaveChatTrigger` - tells the bot to leave a groupchat, announcing who commanded it

`LockChatTrigger` - tells the bot to lock a groupchat.

`MessageOnJoinTrigger` - tells the bot to welcome a specific user with an message every time they join a chat the user is in. Recommended not to use too much, and to set a long timeout to prevent abuse.

`ModerateTrigger` - tells the bot to set the groupchat to be moderated.

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

`TumblrTrigger` - Allows the bot to post things to a tumblr blog, either by commands (!postphoto, !postquote, !posttext, !postlink, !postchat, !postaudio, !postvideo), or by monitoring the chatrooms the bot is in for links. You will need to register an app here: http://www.tumblr.com/oauth/apps and follow these instructions to get the keys: https://groups.google.com/d/msg/tumblr-api/gz8Zv-Mhex4/8-eACnkArkgJ.

`UnbanTrigger` - unbans a user from a groupchat.

`UnlockTrigger` - unlocks a groupchat.

`UnmoderateTrigger` - unmoderates a groupchat.

`UrbanDictionaryTrigger` - Queries Urban Dictionary for the first definition of a word, then pastes it into chat.

`WolframAlphaTrigger` - Queries Wolfram Alpha if a message starts with a specified command. This only displays a textual representation of the primary result (if it exists) so it's not always a good answer. You will need an appId from http://products.wolframalpha.com/api/.

`YoutubeTrigger` - Responds to a message with the top YouTube search result if it starts with a specific command. Also has an option to randomly rickroll instead of returning the best result.

### Universal properties that work on *all* triggers (defined in BaseTrigger)

`delay` - number - delay in ms between when the response is processed and when it's actually sent to the steam servers.

`probability` - 0-1 - what is the likelyhood that the command will occur? Random number generated before any other checks must be less than this. Defaults to 1.

`timeout` - number - how long in ms is a trigger disabled for before it can be used again.

`respectsFilters` - bool - intended to be used internally, to override filters (as defined below)

`ignore` - ['steamid64','steamid64'] - this filter is an array of steamid64s of users that this command will not work for, as well as groups this command cannot be used in. If a user or a groupchat matches any element, trigger will not be allowed to proceed.

`user` - ['steamid64','steamid64'] - this filter is an array of whitelisted steamid64s of users that are allowed to use this command or groupchats that are allowed to use this command. If the steamid64 matches any elements, or if this array is not defined, trigger will be allowed to proceed (to the next filter, at least).

`rooms` - ['steamid64','steamid64'] - this filter is an array of whitelisted steamid64s of groupchats for a trigger. If the steamid64 matches any elements, or if this array is not defined, trigger will be allowed to proceed (to the next filter, at least).

`command` - "!string" - this isn't universal, however many triggers allow you to change the default command using this option.

To get this running in Windows you'll need to follow the setup instructions for [node-gyp](https://github.com/TooTallNate/node-gyp#installation) and also use a branch of libxmljs as described in [this issue](https://github.com/polotek/libxmljs/issues/176) (TLDR is to run 'npm install polotek/libxmljs#vendor-src' before 'npm install').

See [example.js](https://github.com/efreak/node-steam-chat-bot/blob/master/example.js) for an example usage.

### Heroku

See the bottom of example-heroku.js for an example of a simple webserver and self-pinger that satisfies heroku's requirements of 1 visit per hour to keep a free Dyno running. It also provides some simple statistics when you visit the /stats url. You need to add a setting APP_URL in heroku config to make the selfpinger work correctly.
