Many triggers have a default command (or commands) defined, so if you don't choose one in the options, the default will be used.

### Global options:
This is not settings for any one individual trigger; rather, these are options that can be used on *any* trigger. It is not always advisable to use them such, but they allow you to limit usage of commands to certain users, among other things:

| option | Type | Default | Description |
| :---: | :---: | :---: | :--------------------- |
| delay | number | | delay in ms between when the response is processed and when it's actually sent to the steam servers. |
| probability | *float* 0-1 | 1 | what is the likelyhood that the command will occur? Random number generated before any other checks must be less than this.|
| timeout | number | | how long in ms is a trigger disabled for before it can be used again. |
| respectsMute | bool | true | does the trigger respect muted status? That is, if the bot is muted, do we answer or not?|
| respectsGlobalFilters | bool | true | Should the trigger respect global ignores defined in the bot constructor? Used for e.g. logging a room where you don't want the bot to say anything, or globally ignoring a user while still logging them. There is a similar setting for triggers to use internally; at the time of this writing the only that uses the internal setting is logTrigger. |
| <s>respectsFilters</s> | bool | true | used internally only (ie, has no effect if you set it), to override filters (as defined below). Cannot be set (would be pointless) |
| ignore | ['steamid64', 'steamid64'] | | this filter is an array of steamid64s of users that this command will not work for, as well as groups this command cannot be used in. If a user or a groupchat matches any element, trigger will not be allowed to proceed. Overrides global filters. (If this is defined, global filters will be ignored)|
| user | ['steamid64', 'steamid64'] | | this filter is an array of whitelisted steamid64s of users that are allowed to use this command or groupchats that are allowed to use this command. If the steamid64 matches any elements, or if this array is not defined, trigger will be allowed to proceed (to the next filter, at least) |
| rooms | ['steamid64', 'steamid64'] | | this filter is an array of whitelisted steamid64s of groupchats for a trigger. If the steamid64 matches any elements, or if this array is not defined, trigger will be allowed to proceed (to the next filter, at least) |
| command | "!string" | see trigger | this isn't universal, however many triggers allow you to change the default command using this option. |
| allowMess... | *boolean* | false | allowMessageTriggerAfterResponse - If we trigger on a given line, should we pass the line down to more triggers or no? |

### `AcceptChatInviteTrigger`

Joins a specified chatroom when invited and says an optional welcome message. set option autoJoinAfterDisconnect to add channels to autojoin list when used.

Options:

- chatrooms = {"roomId1": "message1", "roomId1": "message1"} - list of rooms to join and their welcome message. If message is null, it will be replaced with defaultMessage; $inviter will be replaced with inviter's steamid64, $inviterurl with their profile url, and $invitername with their name/url.
- autoJoinAfterDisconnect = boolean - automatically rejoin chat after the bot reconnects or starts up again (unless it has been removed from chat since it was invited)
- joinAll = bool or array - set to 'true' to allow *anyone* to invite the bot to *any* chat. Set to false to only allow people to invite it to specified chats. Set to an array of users to only allow those users to invite the bot to all chats (anyone can still invite the bot to the chats specified)
- defaultMessage = string - used when a room's welcome message is set to null (not falsy, only null) or when joinAll is being used to allow joining unspecified chats. replaceable info is same as above.

### `AcceptFriendRequestTrigger`

Automatically accepts any friend requests sent to the bot.

### `AddFriendTrigger`

Tells the bot to add someone as a friend. You must input a steamid64.

Options:

- command - *string* - defaults to "!friend"

### `BanCheckTrigger`

Checks to see if a user has any VAC/economy/community bans via steam API. Requires a steam api key, defined as option apikey in the plugin, or globally defined as a chatBot option steamapikey

Options:

- command - *string* - defaults to "!********************************************************************"
- cacheTime - *int* - Message will not be sent if last join was within this much time, to reduce spam; Defaults to 1 hour (`3600000`). Set to -1 to disable onjoin checking.
- apikey - *string* - your steam API key. Define it globally in the bot constructor if you don't want to define it here, but you *need* this.
- onjoin - *boolean* or *object* - does it announce when someone joins a room with a ban? Set to true, false, or an array of chats to announce in.
- respectsMute - global option, defaults to false (this option defaults to true on most plugins)

### `BanTrigger`

Bans a user from a groupchat. User does not need to be in groupchat for this to work.

Options:

- command - *string* - defaults to "!ban"
- user - *array* of *string*s. Who can use this trigger

### `BitcoinTrigger`

Does various actions over the BTC network. [Coinbase api](https://www.coinbase.com/settings/api) (create OAuth application). Must have webserver enabled.

Options:

Required:

- clientID - *string* - Coinbase clientID
- clientSecret *string* - Coinbase clientSecret
- redirectURI *string* - redirectURI for OAauth app

Optional:

- clearcommand - *string* - defaults to !clear
- authcommand - *string* - defaults to !auth
- saveTimer - *integer* - database file save interval, defaults to 5 minutes
- sellcommand - *string* - defaults to !sell
- buycommand - *string* - defaults to !buy
- balancecommand - *string* - defaults to !balance
- pricescommand - *string* - defaults to !prices
- dbFile - *string* - database file name

### `BotCommandTrigger`

Runs a specified callback when a specific command message is typed. It is preferred to write an actual trigger, but for simple things (e.g. muting, unmuting), this is easier.

Options:

- matches - *array* of case-insensitive *string*s - when to trigger the callback.
- exact - *boolean* - true to only trigger on an exact match, false to trigger on partial match
- callback - `function(bot,data){}` - function to call when a match is found. Data is optional and consists of {toId,fromId,message}.

### `ButtBotTrigger`

Repeats a message, but with one word randomly replaced with a specific other word. The canonical example is replacing a random word with "butt".

Options:

- replacement - *string* - the word to replace the random word with.
- probability - see global triggers.

### `CSGOStatTrigger`

Retrieves a player's csgo stats from steamapi and replies with improtant information

Options:

- command - *string* - defaults to !csgostats, command that triggers the query
- apiKey - *string* - steam apikey, use this or define it in chatbot options

### `ChatReplyTrigger`

Detects a message (either an exact match or a "contains" match) and replies with a specified message.

Options:

- matches - *array of strings* - messages that trigger the response
- responses - *array of strings* - the response will be a randomly selected string from this array
- exact - *boolean* - if this is true, the message received must be an exact match, if it's false the message just must contain the match (both case-insensitive)
- users - *array of string* - the steamIds of the users that can trigger a response, can be null or empty to match all users
- respond - *string* - where to respond? in 'group', 'pm', or nothing to respond wherever the command was sent (default)
- 
### `ChooseTrigger`
 
Chooses a random item from a list supplied.
 
Options:
- command (string) - defaults to "!choose"

### `CleverbotTrigger`

Uses cleverbot to reply to a message, optionally only when a specific word is mentioned.

Options:

- cleverbot - cleverbot-node *object* - use this as the cleverbot (object) if passed in (optional)
- session - *string* - construct a new cleverbot with this session (optional)

### `DoormatTrigger`

Sends a message ("Hello username") to someone when they join the chat. You might prefer to use *MessageOnJoinTrigger*.

Options:

- ???

### `GithubTrigger`

Tells you in chat when something happens to your repo. You need to set up a webhook as well.

Options:

- room = string - where do you want events announced? REQUIRED.
- path = string - where should github attach? (you might be running multiple bots on the same host. I am) Defaults to /GitHubWebHook
- secret = string - use the same secret as you put in the webhook. You can consider it an API key for github to use when it connects to the bot.
- showDetails = string - Show details of actions. IE the actual comment text added if true, otherwise just the username/place of the comment.
- disabled, disabled = array - if you don't want *all* events enabled, then you should set a whitelist or blacklist with an array of items you want enabled/disabled.
  - The individual values must be the event names from https://developer.github.com/v3/activity/events/types
  - For subtypes like pullrequest actions, add the type, then / then the subtype. EG 'pull_request/synchronize'. * as a subtype means all subtypes.
  - If you're using a blacklist *and* a whitelist, you need to explicitly add all subtypes to the blacklist/whitelist.

Commands: none yet (planned)

### `GoogleTrigger`

Prints out the title and link of the first search result on Google.

Options:

- google - google object - Optional. Created if not pre-defined. Not entirely sure what the advantages are of this, possibly account logins.
- command - *string* - defaults to "!google" 

### `GoogleImagesTrigger` - __Does not work__

Prints a link to the first search result on Google Images.

Options:

- images - google-images object - Optional. Created if not pre-defined. Not entirely sure what the advantages are of this, possibly account logins.
- command - *string* - defaults to "!gi"

### `InfobotTrigger`

An infobot trigger. Does not learn on its own (e.g. things need to be defined with !learn)

Options:

- commands - object containing a string or array strings for each command
    - cmdLearn - defaults to "!learn"
	- cmdTell - defaults to "["what is","who is","what are","who are"]"
	- cmdLock - defaults to "!lockword" (compatibility with !lock for (un)locking the chat)
	- cmdUnlock - defaults to "!unlockword"
	- cmdFull - defaults to "!wordinfo" - shows all information on the command (who changed it last and when, and full json value)
- admin - string or array of strings - steamid64(s) of those allowed to lock/unlock values
- userlearn - bool - are regular users allowed to make the bot learn stuff (or only admins)? defaults to true
- ueberDB - ueberDB - an *initiated* instance of ueberDB https://github.com/Pita/ueberDB if you don't want to use an sqlite db, or if you want to share it.
- dbFile - string - path to the sqlite3 database that you want to use. defaults to "chatbot.username/triggername.db"

### `InfoTrigger`

Provides information about the status of the bot (amount of time it was running, operating system, etc)

Options:

- command - defaults to !botinfo

### `JoinChatTrigger`

Tells the bot to join a groupchat, and announce who sent it

Options:

- command - defaults to "!join"
- notify - bool - defaults to true. Should we tell the chat who told the bot to join?

### `jsonTrigger`

Trigger that fetches some json from a web service and returns part of it.

Options:

- url - string - the url of the webservice
- url - function(userId,roomId,message,trigger) - a function that returns the URL of the webservice (if you want to use some data from the command). Example: `function(u,r,m,t){return "http://api.icndb.com/jokes/random/"+t._stripCommand(m)}`
- parser - array - array containing the order of the response to parse, if it's in valid json. Example response: `{"value": { "joke": "iwantthis" } }`? example parser: `["value","joke"]`
- parser - function that parses the response. Either send the response yourself, or return the response to have it sent to the groupchat or user. `function(data, userId, roomId, message, trigger)`


### `KickTrigger`

tells the bot to kick someone from a groupchat.

Options:

- command - defaults to "!kick"

### `LeaveChatTrigger`

tells the bot to leave a groupchat, announcing who commanded it

Options:

- command - defaults to "!leave"
- notify - bool - defaults to true. Should we tell the chat who told the bot to leave?

### `LinkNameTrigger`

Attempts to fetch all urls seen by the bot, parses them as html, and announces the page title.

### `LockChatTrigger`

Tells the bot to lock a groupchat. Does not respect mute.

Options:

- command - defaults to "!lock"

### `LogTrigger`

Trigger that logs chat messages to files by groupchat "botname/logs/groupsteamid64.log". You NEED to put this trigger first, or it might not log
everything. Removes blank lines.

- logDir - defaults to "./botname/logs"
- roomNames - an object containing steamid64s for groups and matching them to their names
- logUserChats, logGroupChats - log individual user/group chats to file?
- logGlobal - log all user/group chats to json. Required for webserver and live logging.
- logConsole - log chatter to console?
- liveUrl, logURL, etc - see the trigger definition file for more help.

### `MathTrigger`

Does math for you!

Options: 

- mathcommand - defaults to "!math"

### `MemeBotTrigger`

Adds ">" before a message it will send. How does it work? Who knows?

Options:

- ???

### `MessageOnJoinTrigger`

tells the bot to welcome a specific user with an message every time they join a chat the user is in. Recommended not to use too much, and to set a long timeout to prevent abuse.

Options:

- user - string - user to send the message on
- message - string - message to send

### `ModerateTrigger`

tells the bot to set the groupchat to be moderated.

Options:

- command - defaults to "!mod"

### `MoneyTrigger`

Converts between currencies, will require an `apikey` from https://openexchangerates.org

Options:

- moneycommand - defaults to "!money"
- currenciescommand - defaults to "!currencies"
- apikey - api key from https://openexchangerates.org/

### `NotificationTrigger`

A Notification trigger. Notify anyone who wants of anything they want. Basically, if a keyword is in a message, it gets sent to their pushbullet/pm/email.

Commands:

- `!seen steamid64` - replies when the last time *steamid64* was seen, formatted by moment().fromNow(). (ie, 1 hour ago)
- `!notify pbapikey asdf` - tests *asdf* as the pushbullet APIkey. Greets user (with name, if avaialble) on success, complains on failure.
- `!notify filter add $YourName` - adds *$YourName* to the filter list, provided none of the banned list is in it.
- `!notify filter list` - lists your current filters.
- `!notify filter remove ##` - removes the ## filter from your list.
- `!notify send TEXT` - tests your filters with 'TEXT', as though it were a line sent from a chat (Without this, the bot will not trigger notifications on your own messages)
- `!notify email some@address.tld` - sets your email address to some@address.tld. Set email to N/No/F/False to disable emails.
- `!notify message BOOL` - enables or disables sending you private messages as notifications. Y/Yes/N/No/T/True/F/False.
- `!notify delete` - Tells the bot to delete you from the database. You must add 'yes' to the end to actually do so.

Options:

- seenCommand - what is the command for the seen function? !seen steamID64.
- cmd - command for pushbullet. Defaults to "!notify"
- banned - array of triggers not allowed. Use this to prevent people from trigger on e.g. 'password' or some such. defaults to [] (blank)
- dbFile - database file. This is a flatfile containing json. Defaults to USERNAME/Notification.db.
- roomNames - object associating group names with ids, for use displaying group name. `{"steamid64":"name","steamid64":"name"}`
- nodemailer - Allows you to pass in an initialized nodemailer instance if you want to use a transport other than smtp/directmailer (ie, AWS, etc). If not included, tries nodemailer-sendmail-transport (below)
- sendmailPath = string - path to sendmail binary. I recommend using ssmtp to use an smtp server. If not included, uses smtpPool (below option)
- smtpPoolOptions - object of options for nodemailer's smtpPool transport. If not included, will try to send mails using direct-transport. Most likely such mails will not be received.
- address - from address for notifications. Noreply address or real address recommended. Required for direct-transport (ultimate fallback).
- hostname = string - hostname that will be used to introduce direct transport mailer to the mx server.
- hashfunc - function used to generate hashes for verifying email addresses. Currently a substring of sha256.
- saveTimer - how often do we save the database to disk? DB is saved after every command, but not on every chat event.
- sendmailArgs - array of arguments to pass to the sendmail path. Use if you want eg a custom config for ssmtp. ['-uusername','-ppassword']

### `OMDBTrigger`

Searches IMDB for a specified movie. Can accept an optional year parameter (ex: !movie aliens 1986). If one is not provided, it will return the first result without the year.

Options:

- command - defaults to "!movie"

### `PlayGameTrigger`

tells the bot to play a game. You need to send the game's appid. - options allowpublic and allowprivate (both true by default) allow you to restrict usage of this command to either private or groupchat messages.

Options:

- command - defaults to "!play"
- allowpublic - allow use in groupchats - defaults to true
- allowprivate - allow use in private messages - defaults to true

### `PlayTrigger`

same as above. Not sure why I have two of this plugin; one or the other may not work.

Options:

- command - defaults to "!play"

### `ProfileCheckTrigger`

When a user joins, look up their profile in steam API and if they have a private profile, or never bothered to set one up, announce it to the groupchat. Optional option: apikey can be defined in options, overriding any steamapikey can be defined in the bot constructor. If neither is defined, it won't be used (not required).

Options:

- cacheTime - Message will not be sent if last join was within this much time, to reduce spam. Defaults to 10 minutes.
- apikey - your steam api key. Can be alternatively defined for the bot globally as an option, steamapikey. Not required for this particular plugin, but if you're hosting multiple bots for multiple people, it may be a good idea to prevent IP blacklisting.

### `RandomGameTrigger`

Default command !randomgame. When command is used, it will check the user's games list (or that of the given steamid64, if one is placed after the command) and return a random game, along with a steam:// link to launch it, and the amount of time spent in that game. Requires apikey in options, or steamapikey in bot constructor.

Options:

- apikey - your steam api key. Can be alternatively defined for the bot globally as an option, steamapikey. Required for this plugin.
- command - defaults to "!randomgame"

### `RegexReplaceTrigger`

Detects a regex match in a message and uses the matches to construct a reply.

Options:

- match - regex - the message to match, must be exact
- response - string - response, possibly including wildcards of the form {0}, {1}, etc as placeholders for the matched regex group

### `RemoveFriendTrigger`

tells the bot to delete a friend.

Options:

- command - defaults to "!unfriend"

### `RollTrigger`

tells the bot to roll dice. Can get very spammy. Can be easily abused to make the bot crash. If you want to use, recommended you set a limit on the number/size of dice rolled (please submit pull request if you do this).

Options:

- command - defaults to "!roll"

### `SayTrigger`

tells the bot to say something in another groupchat.

Options:

- command - defaults to "!say"

### `SetNameTrigger`

changes the bot's display/profile name.

Options:

- command - defaults to "!name"

### `SetStatusTrigger`

changes the bot's status between online, away, snooze, etc.

Options:

- command - defaults to "!status"
- statuses - object defining statuses. See the trigger to see how they work.

### `StatusTrigger`

Trigger that sends a status message in public or private to anyone joining the chat. Use rooms:[] in options to limit it to one groupchat.

Options:

- admin - string - steamid64 of those allowed to change the status message. If not defined, anyone can change it.
- command - string - command to change the message. Defaults to !status
- locate - string - where to store the statuses on disk. Defaults to ./BOTNAME/StatusTrigger/TRIGGERNAME. if you need storages to be shared, set them to `myBot.username + "/StatusTrigger"` or some such.
- public - bool - send the message to the joining user, or to the chat? To the chat if true (default), to the user if false.

### `SteamIDTrigger`

Takes a player's name and converts to a SteamID, name doesn't need to be exact

Options:

- command - *string* - defaults to !steamid

### `SteamrepOnJoinTrigger`

checks steamrep API whenever someone joins a chat the bot is in. If Steamrep lists the user as a scammer, then bot announces it and gives links for more info.

### `SteamrepTrigger`

same as `SteamrepOnJoinTrigger`, but provides a command rather than automatic onjoin check.

Options:

- command - defaults to "!steamrep"

### `TranslateTrigger`

uses http://hablaa.com/api to translate. Define a `translatecommand` (command used to do translating) and a `languagescommand` (command used to print language codes), or leave as default. Usage is `!translate <word> <start language> <end language>` to translate, `!languages` for a list of language codes (sent via private message), and `!languages <code>` to see what language does with that code. To see an example sentence with a word and a language, the usage for examples is `!example <word> <start language> <end language> <example language>`. Example language is the language the example will be in. 

Options:

- translatecommand - defaults to "!translate"
- languagecommand - defaults to "!languages"
- examplecommand - defaults to "!example"

### `TumblrTrigger`

Allows the bot to post things to a tumblr blog, either by commands (!postphoto, !postquote, !posttext, !postlink, !postchat, !postaudio, !postvideo), or by monitoring the chatrooms the bot is in for links. You will need to register an app here: http://www.tumblr.com/oauth/apps and follow these instructions to get the keys: https://groups.google.com/d/msg/tumblr-api/gz8Zv-Mhex4/8-eACnkArkgJ.

Options:

- Please see the trigger file for help.

### `UnbanTrigger`

unbans a user from a groupchat.

Options:

- command - defaults to "!unban"

### `UnlockTrigger`

unlocks a groupchat.

Options:

- command - defaults to "!unlock"

### `UnmoderateTrigger`

unmoderates a groupchat.

Options:

- command - defaults to "!unmod"

### `UrbanDictionaryTrigger`

Queries Urban Dictionary for the first definition of a word, then pastes it into chat.

Options:

- command - defaults to "!ud"
- maxlength - defaults to 540
- toolongerr - what to show at the point where a reponse is longer than maxlength? defaults to "---Definition too long. Please use your browser.---"

### `WolframAlphaTrigger`

Queries Wolfram Alpha if a message starts with a specified command. This only displays a textual representation of the primary result (if it exists) so it's not always a good answer. You will need an appId from http://products.wolframalpha.com/api/.

Options:

- command - defaults to "!wolfram"
- appId - string - the app ID to use when creating a new client (or you can use client, below)
- client - initiated wolfram client - use this as the client if it is passed as an option

### `YoutubeTrigger`

Will respond to a Youtube search term, whether it be a video or a channel (1st result, will be automatic). This will require an API key (not OAUTH token) from Google. This can be found here: https://console.developers.google.com (create a project, and generate an API key, if you need extra help google it) and defined as `apikey: <key>`.

Options:

- command - defaults to "!yt"
- apikey - required
