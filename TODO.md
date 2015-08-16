---
layout: page
title: TODO
tagline: Plans and vague ideas for improving and extending steam-chat-bot
redirect_from: "/TODO/"
---

If you're looking at this file, please keep in mind that this file is *far* more than just a todo list. It's also a file of vague ideas I've had, things I've already done, things I want to do, things I'd like to do but probably won't, and things I'm still trying to decide if I should do. Some of it is also notes to myself. If you know anything about supybot/limnoria, you'll probably notice quite a bit of similarity in here.

### ChatBot.js
- Some way to load triggers as external npm modules.
  - Currently wolfram and several other modules take an annoying amount of time to compile on slow systems
    - get around this by requiring users to install them manually. (I wish npm had a 'suggested' or 'related' modules along with the optional dependencies that install by default).
  - This will allow people to write their own triggers/plugins and not publish them, yet continue to use the bot.
  - in chatBot.js itself: `myBot.addTriggerModule(name,options)` ==> `require(name)(options).init(this)`
  - in a new type of trigger: `{name:'extrigger',type:'ExternalTrigger,options:{module:'moduleName',orFile:'some/path.js',options:{}}}` --> same as above, pretty much
- Move extra files from lib/triggers to lib/extras or some such
- Database configuration - massive
- Internal database engine. Probably UeberDB, since it's easy and supports several different engines. SQLite as preferred backend.
  - Allow passing of different database engines with required functions (getvalue, setvalue). Use ShittyDB or a localStorage dropin as an example.
  - Convert existing plugins to use this instead of current.
  - Does UeberDB support multiple tables inside sqlite? Or anywhere else, for that matter? I don't remember. Or care, really.
  - Allow sharing database backend among multiple bots in the same file (export the functions, probably)
  - GetNV/SetNV like ZNC has?
    - ChatBot.js
      - this.GetNV = function(key,default){}
      - this.SetNV = function(key,value){}
    - baseTrigger
      - this.GetNV = function(key, default){ retrun ChatBot.GetNV(trigger.name+key,default) }
      - this.SetNV = function(key, value){ retrun ChatBot.GetNV(trigger.name+key,value) }
  - Option to use a single db or multiple per-trigger dbs
     - database for all triggers = cleaner filesystem, can be stored in project root
     - separate databases for separate triggers = easier renaming of triggers, copying/moving of data
  - Would allow triggers to easily save persistent settings.
- User hierarchy. Built-in user management with a public API. Add user, add permission flags, etc. I really like supybot, can you tell?
- Per-chat muting. When someone uses a command in a muted chat, it should respond to them in PM.
- Process management
  - fork after start (optional, not default)
  - reload triggers on sighup
  - pidfile
  - helper script for above, maybe?
- Consider [chroot](https://www.npmjs.com/package/chroot)ing or [jail](https://www.npmjs.com/package/jail)ing.
- Fix announcements!
- Supybotify everything!

### Triggers
- LogTrigger
  - Update the hash when options get changed
  - Solarized stylesheet
  - New style/option: No UI, no stylesheet, and configurable number of lines, used for embedding inside an iframe with an external stylesheet, to show what's going on in chat on an external website.
  - Stylesheets should be configurable in the hash
  - Stylesheets should be done normally, rather than being sent through the websocket. Why did I do that? It does make sense to send the list that way, though.
  - When you reconnect, it currently checks the timestamp of [i]every[/i] message. Instead, we should send a timestamp when we connect, and not send messages older than the timestamp.
  - Browser uses too much memory if the log stays open too long. Have an option to *remove* older elements as newer elements pop in. Figure out some way of doing this as elements pop in instead of having a javascript heavy site, as that would defeat the purpose.
  - Maybe figure out some way to link the logservers of various bots running under the same process? It would be nice to have a single logviewer for all bots.
  - Add example configs for nginx frontend. Not supporting apache, though example is welcome.
  - Get the mime types sent across correctly or embed everything. Currently everything is sent as text/html, which bugs out with a nosniff header. Possibly requires changes to core.
  - Get it working behind a complete reverse proxy again, so the logs can be at root of a (sub)domain
    - Need to figure out how to serve the socket.io client script this way, that's built into socket.io
      - socket.io allows a custom url for the client script, but it unfortunately doesn't seem to allow for a *second* url. Maybe set up a wildcard proxy (*/socket.io/* ==> http://localhost:port/socket.io) or redirect?
    - Also, socket.io's namespacing requires the new url to match the url in the *browser*, not the one on the server. This means having a separate 
  - Figure out some way to get output that's compatible with an IRC stats app, so we can get lovely stuff.
  - **CLEAN UP CODE!!!**
- Webserver plugin
  - Templated webserver plugin for serving a full website.
  - Internal Webserver default page
    - Show built-in help pages created from the planned built-in help functions.
      - Until the above function is complete, redirect the main page and 404s to the github page.
    - allow a passthrough in config to override this and show pages from either a custom directory, or use a custom middleware/function (basically, just expose an express router)
- GithubTrigger
  - Fix to work with new webserver
  - Finish writing it (duh)
- Rename "triggers" that don't trigger on anything
  - Things like the IRC relay. If it's not a standard trigger type, it maybe shouldn't be called a trigger.
- WebUI
  - Maybe split this off into another project entirely? does this need to be part of steam-chat-bot? it seems rather big and unrelated. There's no reason to use steam-chat-bot as a framework, really.
    - Possibly have steam-chat-bot as a dependency. steam-chat-webui manages multiple chatbots?
  - implement trigger options editing
  - debug ajax calls so that it doesn't bug out when we load a trigger with options
  - Navigatable list of groupchats the bot is currently in. At right, options for toggling moderation, locking.
  - navigatable list of users in the currently selected groupchat. At right, options for kick/ban from chat/group, at top unban from chat/group
  - turn into a fully functional group management tool for groupchats and etc.
- question-answer based setup for configuring the initial setup file. See supybot's initial config.
- BaseTrigger.js
  - Maybe rename filters to 'whitelist' and 'blacklist' to make it more clear what they do?
    - This will break many configs.
    - Since this will break *all* of my configs, many of which are now split up into multiple files, this is unlikely to happen.
  - Maximum public response length. If response exceeds this, send privately to avoid spamming. Individual triggers should be able to override this.

### New Triggers
- BaseCommandTrigger
  - Define functions in trigger file, run a function to add them to the bot with the given command.
  - Built-in help system
  - Add constructor option for commandPrefix such as ! or ~ or etc.
    - We have 2-4 bots going in the test chat at any given time. They all respond to mostly the same !commands.
- I wonder if we can get PieSpy on steam, it might be kinda cool.
- Announcement trigger for the owner to send a message to all open chats, except those in the ignore list.
- Javascript eval function. Use something sandboxed like [localeval](https://www.npmjs.com/package/localeval)
- Shell eval function. Make sure all input, including pathnames, is escaped when not being used by an admin, and set the pwd to /tmp.
- SteamDB searching
- Steam API searches (game info/prices, etc)
- ITAD api searches when the public API gets released.
- Port of [PieSpy](http://www.jibble.org/piespy/) for visualization
  - *PieSpy is an IRC bot that monitors a set of IRC channels. It uses a simple set of heuristics to infer relationships between pairs of users. These inferrences allow PieSpy to build a mathematical model of a social network for any channel. These social networks can be drawn and used to create animations of evolving social networks.*

### IN PROGRESS
- IRC Relay - needs commands (!users, etc)
- get tests working again, @dragonbanshee working on this I think?
- Web UI for common functions
  - Send a message to a groupchat
  - Change bot's name/status
  - Set bot chat status to offline/online (this is already possible through commands, it just can't be undone yet...)
- Web UI for common functions
  - shutdown bot
  - provide a javascript shell inside the bot context for debugging, maybe?
  - styles
  - public interface so users can check the bot's status, private interface with inputs and crap.

### Done locally, not yet merged into github (possibly not merged into *any* repo)


### DONE
- Global ignores
- Move webserver to chatBot.js
- Change from logTrigger/ws to chatBot.js/socket.io
- Fix global ignores.
