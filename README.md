node-steam-chat-bot
===================

Simplified interface for a steam chat bot. This is a wrapper around [Steam for Node.js](https://github.com/seishun/node-steam) which is aimed at making an easily configurable chatbot that sits in Steam groups chat rooms and responds to various events. Responses are handled as a set of triggers of various types which can be configured to respond to a number of different chat messages. Steam requires that a user has at least one game before it can join chat rooms (unless it's a mod), so you'll need to buy a game for the bot account or make it a mod before it will be able to join.

If you have Steam Guard enabled you'll get a failed logon attempt the first time you try to log on and you'll be sent a Steam Guard code. Pass this code in with the constructor (e.g. new ChatBot('username', 'password', { guardCode: 'XXXX' };) and you should be able to log in. A 'sentry' file will be stored, which should allow you to log in with a different computer using the same guard code but I've honestly never tried this so ¯\\_(ツ)_/¯. If you start getting logon failures again you should delete the sentry file, remove the guard code, and try to log in with neither so you get a fresh code emailed to you.

### Current Triggers:


AcceptChatInviteTrigger - Joins a specified chatroom when invited and says an optional welcome message. set option autoJoinAfterDisconnect to add channels to autojoin list when used.

AcceptFriendRequestTrigger - Automatically accepts any friend requests sent to the bot.

AddFriendTrigger - provides a !add command. You should probably restrict this and other similar commands to admin user(s) only.

BanTrigger - bans a user from a groupchat. User does not need to be in groupchat for this to work.

BotCommandTrigger - Runs a specified callback when a specific command message is typed. The callback is passed the bot object allowing bot functions (e.g. mute, unmute, joinGame) to be run regardless of scope. This is a breaking change going from v1.1.x to v1.2.0.

ButtBotTrigger - Repeats a message, but with one word randomly replaced with a specific other word. The canonical example is replacing a random word with "butt".

ChatReplyTrigger - Detects a message (either an exact match or a "contains" match) and replies with a specified message.

CleverbotTrigger - Uses cleverbot to reply to a message, optionally only when a specific word is mentioned.

GoogleTrigger - Prints out the title and link of the first search result on Google. Ability to get multiple results will be added later.

GoogleImagesTrigger - Prints a link to the first search result on Google Images.

IsUpTrigger - checks to see if a webserver is running.

JoinChatTrigger - tells the bot to join a groupchat - set option notify to false if you don't want the bot to announce who told it to join the chat.

KickTrigger - tells the box to kick someone from a groupchat.

LeaveChatTrigger - tells the bot to leave a groupchat. - set option notify to false if you don't want the bot to announce who told it to leave the chat.

LockChatTrigger - tells the bot to lock a groupchat.

MessageOnJoinTrigger - tells the bot to welcome a specific user with an message every time they join a chat the user is in. Recommended not to use too much, and to set a long timeout to prevent abuse.

ModerateTrigger - tells the bot to set the groupchat to be moderated.

PlayGameTrigger - tells the bot to play a game. You need to send the game's appid. - options allowpublic and allowprivate (both true by default) allow you to restrict usage of this command to either private or groupchat messages.

RegexReplaceTrigger - Detects a regex match in a message and uses the matches to construct a reply.

RemoveFriendTrigger - tells the bot to delete a friend.

RollTrigger - tells the bot to roll dice. Can get very spammy. Can be easily abused to make the bot crash. If you want to use, recommended you set a limit on the number/size of dice rolled (please submit pull request if you do this).

SayTrigger - tells the bot to say something in another groupchat.

SetNameTrigger - changes the bot's display/profile name.

SetStatusTrigger - changes the bot's status between online, away, snooze, etc. - options: statuses {online,busy,away,snooze,trade,play,offline}. You can set these to false to disable them, or to whatever you wish the second part of the command to be in order to tell the bot to set that status. Defaults: online, busy, away, snooze, trademe, playme, and false. Recommended you don't allow the bot to be set offline unless you have a way to bring it back online.

SteamrepOnJoinTrigger - checks steamrep API whenever someone joins a chat the bot is in. If Steamrep lists the user as a scammer, then bot announces it and gives links for more info. option whoToTell - if this is defined, the bot will not announce scammers; rather it will send them to this steamid64.

SteamrepTrigger - same as SteamrepOnJoinTrigger, but provides a command rather than automatic onjoin check.

TumblrTrigger - Allows the bot to post things to a tumblr blog, either by commands (!postphoto, !postquote, !posttext, !postlink, !postchat, !postaudio, !postvideo), or by monitoring the chatrooms the bot is in for links. You will need to register an app here: http://www.tumblr.com/oauth/apps and follow these instructions to get the keys: https://groups.google.com/d/msg/tumblr-api/gz8Zv-Mhex4/8-eACnkArkgJ.

UnbanTrigger - unbans a user from a groupchat.

UnlockTrigger - unlocks a groupchat.

UnmoderateTrigger - unmoderates a groupchat.

UrbanDictionaryTrigger - Queries Urban Dictionary for the first definition of a word, then pastes it into chat. Easily abused, as the bot can bypass steam's limit on characters per message, though it still gets cut off after a certain extent.

WolframAlphaTrigger - Queries Wolfram Alpha if a message starts with a specified command. This only displays a textual representation of the primary result (if it exists) so it's not always a good answer. You will need an appId from http://products.wolframalpha.com/api/.

YoutubeTrigger - Responds to a message with the top YouTube search result if it starts with a specific command. Also has an option to randomly rickroll instead of returning the best result.

### Universal properties that work on *all* triggers (defined in BaseTrigger)

delay - number - delay in ms between when the response is processed and when it's actually sent to the steam servers.

probability - 0-1 - what is the likelyhood that the command will occur? Random number generated before any other checks must be less than this. Defaults to 1.

timeout - number - how long in ms is a trigger disabled for before it can be used again.

respectsFilters - bool - intended to be used internally, to override filters (as defined below)

ignore - ['steamid64','steamid64'] - this filter is an array of steamid64s of users that this command will not work for, as well as groups this command cannot be used in. If a user or a groupchat matches any element, trigger will not be allowed to proceed.

user - ['steamid64','steamid64'] - this filter is an array of whitelisted steamid64s of users that are allowed to use this command or groupchats that are allowed to use this command. If the steamid64 matches any elements, or if this array is not defined, trigger will be allowed to proceed (to the next filter, at least).

rooms - ['steamid64','steamid64'] - this filter is an array of whitelisted steamid64s of groupchats for a trigger. If the steamid64 matches any elements, or if this array is not defined, trigger will be allowed to proceed (to the next filter, at least).

ignore - ['steamid64','steamid64'] - this filter is a blacklist of users and groupchats that are not allowed to use the given trigger.

command - "!string" - this isn't universal, however many triggers allow you to change the default command using this option.

To get this running in Windows you'll need to follow the setup instructions for [node-gyp](https://github.com/TooTallNate/node-gyp#installation) and also use a branch of libxmljs as described in [this issue](https://github.com/polotek/libxmljs/issues/176) (TLDR is to run 'npm install polotek/libxmljs#vendor-src' before 'npm install').

See [example.js](https://github.com/efreak/node-steam-chat-bot/blob/master/example.js) for an example usage.
