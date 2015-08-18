Post-2.2.0 (unreleased as yet)
==================

  * Created website with jekyll, hosted on github pages. Send users here for support.
  * Update dependencies
  * Consistency
  * Prevent abuse of roll trigger killing the bot
  * Fix examples
  * Fix YoutubeTrigger crash

[2.2.0 / 2015-08-11 - PanStoXDexter](https://github.com/Efreak/node-steam-chat-bot/releases/tag/2.2.0)
==================

  * v2.2.0
  * Update to node-steam 2.2.0
  * Fix Codacy issues

[2.1.1 / 2015-07-20 - VeniVidiYoutubePoop](https://github.com/Efreak/node-steam-chat-bot/releases/tag/2.1.1)
==================

  * v2.1.1
  * fix option = option &#124;&#124; true everywhere (thanks, /u/Guilemouse)
  * Allow adding users/group chats to banned items in notificationtrigger
  * Fix global ignores
  * Allow access to the expressjs constructor
  * Finish logTrigger changes
  * Add socket.io stuff
  * Change the way routers work
  * notificationTrigger: Allow other triggers to parse messages
  * Google Image crash fix.
  * Allow non-trigger files in triggers directory
    * files for logTrigger are now kept in triggers/logTrigger/*
  * Add irc dependency
  * githubTrigger: Allow multiple rooms
  * Add buggy, poorly written IRC relay (incomplete)
  * Add per-trigger functions for onLoggedOn and onLoggedOff
  * Separate onLoad for db stuff
  * Update dependencies
  * Make the uptime better

[2.1.0 / 2015-06-30 - senpaiplznoticemeeeeeee](https://github.com/Efreak/node-steam-chat-bot/releases/tag/2.1.0)
==================

- New trigger: githubTrigger will notify you when configured repos have activity. Requires built-in webserver enabled, this will be fixed in next release.

- logTrigger pings always
- new global ignores (setting ignore on a single trigger overrides the global ignore, even if it's empty)
- acceptChatInviteTrigger
  - now allows default entry messages (set a room's entry to null to use default, or to false to not have a message)
  - now allows you to specify admins that can invite the bot anywhere (just set it to `true` to allow anyone to invite anywhere)
- fix triviatrigger
- bugfixes (triviatrigger, logtrigger)
- Multiple codacy issues resolved
- add option for favicon in webserver
  - Only works behind reverse proxy if frontend root is same as backend root.
  - Set to 'true' to redirect to nodejs.org's favicon
- Add example for webserver config (really just using expressjs)



[2.0.1 / 2015-06-21 -  bugfixes + translateTrigger](https://github.com/Efreak/node-steam-chat-bot/releases/tag/2.0.1)
==================

- [f93f3c8](https://github.com/Efreak/node-steam-chat-bot/commit/f93f3c8) - Add example translations to translateTrigger
- [8552e83](https://github.com/Efreak/node-steam-chat-bot/commit/8552e83) - Fix json in package.json
- [cc3d426](https://github.com/Efreak/node-steam-chat-bot/commit/cc3d426) - Add debugging
- [d152f7f](https://github.com/Efreak/node-steam-chat-bot/commit/d152f7f) - Try fixing triviaTrigger
- [1c6295e](https://github.com/Efreak/node-steam-chat-bot/commit/1c6295e) - Fix winston logging
- [08761f3](https://github.com/Efreak/node-steam-chat-bot/commit/08761f3) - Fix rollTrigger
- [d496dfe](https://github.com/Efreak/node-steam-chat-bot/commit/d496dfe) - Fix changelog, remove dates



[2.0.0 / 2015-06-20](https://github.com/Efreak/node-steam-chat-bot/releases/tag/2.0.0)
==================

- [4b9e63c](https://github.com/Efreak/node-steam-chat-bot/commit/4b9e63c3f2d467417f655b982a2f4df176f036c8) - Reduce unnecessary logging
- [f39a223](https://github.com/Efreak/node-steam-chat-bot/commit/f39a223a6baa0433b760ede47cfab05c343ac776) - Remove private data from debug (still shown in silly logs)
- [c277c2c](https://github.com/Efreak/node-steam-chat-bot/commit/c277c2c004fd342f5ad9c7809aa55bc248d6efbf) - Add trigger functions for trade and announcement events
- [1df013c](https://github.com/Efreak/node-steam-chat-bot/commit/1df013cfcbff35b50d3fa122a888385bb85585e0) - Add more options for acceptChatInviteTrigger
- [05ae588](https://github.com/Efreak/node-steam-chat-bot/commit/05ae588403746777d856585038d6fa9a58c660f4), [e7d639d](https://github.com/Efreak/node-steam-chat-bot/commit/e7d639d274d4d828b3283761411f263f7704ee2c) - Fix typo
- [8467b24](https://github.com/Efreak/node-steam-chat-bot/commit/8467b24124ad18c496074cd4b76338c5156275fe) - Error checking on servers file
- [6ed5ec7](https://github.com/Efreak/node-steam-chat-bot/commit/6ed5ec70e8c8d6956c2de731eda728753cd0382b) - Don't expose username anywhere but the config if requested
- [05d6a51](https://github.com/Efreak/node-steam-chat-bot/commit/05d6a51f618f1f0bd3e667ee41b7a7155ae41ff3) - Add onLogon that can be defined in config
- [f703168](https://github.com/Efreak/node-steam-chat-bot/commit/f703168aca8caaa8ea82cfb0f3429a6fc254d9df) - Move autoconnect list
- [ffd8658](https://github.com/Efreak/node-steam-chat-bot/commit/ffd865870760304ffaa61910a165eedc692c71dd) - Fix annoucnement event
- [f10333d](https://github.com/Efreak/node-steam-chat-bot/commit/f10333d6218d764a6e6bcc43f08c4cd0b14e3ca2) - Fix typo
- [f10333d](https://github.com/Efreak/node-steam-chat-bot/commit/c14030d895887d9240a8a43d97ab50b348af8bb3) - Add shortcuts to _userName and _userString (defined in chatBot.js) to baseTrigger
- [0eec67b](https://github.com/Efreak/node-steam-chat-bot/commit/0eec67ba0e77677cea8b3fa566c94dd53ddfbc30) - NotificationTrigger: Add support for only sending to a single pushbullet device
- [4ce6eb4](https://github.com/Efreak/node-steam-chat-bot/commit/4ce6eb41ea41a6d3a2718fd18fe0fca6897e88a7) - NotificationTrigger: Send pushed when setting up pushbullet
- [dc8494a](https://github.com/Efreak/node-steam-chat-bot/commit/dc8494ae8b946ba6154af87828a799253b517e12) - NotificationTrigger Add pushover support (incomplete, needs testing)
- [56cdb25](https://github.com/Efreak/node-steam-chat-bot/commit/56cdb2539deab541067b0db6b928208c4c0442aa) - Add download stats
- [d41e65a](https://github.com/Efreak/node-steam-chat-bot/commit/d41e65add49baa21777eac0b5d3274654de37c09) - Add TriviaTrigger
- [f954ede](https://github.com/Efreak/node-steam-chat-bot/commit/f954edebd7391e3a5dfc93f2ffd422c12844b190) - Add pushover dependency
- [3b9af7e](https://github.com/Efreak/node-steam-chat-bot/commit/3b9af7e68ca973dc87f4b202d1d8959b6d1ec633) - Add reddit link to README.md, add link to bonnici's original module
- [294e310](https://github.com/Efreak/node-steam-chat-bot/commit/294e31001b7a1253ede33a316c8ff20fa015233d) - Fix typo



[1.9.0 / 2015-06-14 - unreleased](https://github.com/Efreak/node-steam-chat-bot/tree/6018c9482bd5ba8f4b872ad9e0a5f91fb10323dc)
==================

- This version was not officially released. The only way to install it is to use the sha hash.
- [d6520cf](https://github.com/Efreak/node-steam-chat-bot/commit/d6520cfa249d3a010b2e079f780707e70ba8e609) - Fixed LinkName
- [996169a](https://github.com/Efreak/node-steam-chat-bot/commit/996169a9039e1160fbf25f79a718127fc9cc5112) - Put Array.prototype into a function
- [0d1631f](https://github.com/Efreak/node-steam-chat-bot/commit/0d1631f5f76548883686607ef3b60f874fcf3c73) - Fix logging when playing no games
- [f24fadc](https://github.com/Efreak/node-steam-chat-bot/commit/f24fadc6b69cd79e2c55e037df2b44fca4ac240d) - Removed old comments
- [37c1da5](https://github.com/Efreak/node-steam-chat-bot/commit/37c1da5bfa2eb64ee774d8a2045fd712bf729030) - Move webserver into chatBot.js
- [f6d381b](https://github.com/Efreak/node-steam-chat-bot/commit/f6d381b2f87fdc15625495803a162fb56b08c7c1) - Expanded readme
- [0365f86](https://github.com/Efreak/node-steam-chat-bot/commit/0365f864c36e043fc08301cf28485a358ccb9410) - Move webserver out of logTrigger.js
- [975bc92](https://github.com/Efreak/node-steam-chat-bot/commit/975bc9242ef18064685b81c943ace1d3593e1ed4) - Moved variable inside of _respond, fixed consistency 
- [f0f3aca](https://github.com/Efreak/node-steam-chat-bot/commit/f0f3aca1c61422c0e7360b7d5bdb4a9aa2e4abec), [7456187](https://github.com/Efreak/node-steam-chat-bot/commit/74561878799ea7c49ad5d83bf713d3c4426fa05d), [9b3c225](https://github.com/Efreak/node-steam-chat-bot/commit/9b3c225bee1f0dcdfcdd67b8df8c7f6983d3be31) - Bug fixes
- [387a749](https://github.com/Efreak/node-steam-chat-bot/commit/387a7496816b512609cc2f3631127f7efa3b7ed5) - Fix server listening and logging
- [33f1e9f](https://github.com/Efreak/node-steam-chat-bot/commit/33f1e9f8362a7e7caf82f4e6d449e1438787c329) - Add _onLoad and some debugging for triggers
- [15a52f8](https://github.com/Efreak/node-steam-chat-bot/commit/15a52f8b02792027704cb57a2d8cad7e8308f372) - Add _onLoad to logTrigger (doesn't wait for someone to say something)
- [99d64bb](https://github.com/Efreak/node-steam-chat-bot/commit/99d64bbada77e3845dbf64837002dae65cfe0fc2) - Add pushbullet options descriptions, fix push titles
- [49437eb](https://github.com/Efreak/node-steam-chat-bot/commit/49437eb117d3f4ff640778ddf5d7a63c8ade1219) - Pushbullet groupname fix, cleanup
- [0353842](https://github.com/Efreak/node-steam-chat-bot/commit/035384210992ab9eab587298a1ec6f95d525c6f9), [255ab7a](https://github.com/Efreak/node-steam-chat-bot/commit/255ab7a598e3356c535f795e2a8476c1019d4848), [4c4e400](https://github.com/Efreak/node-steam-chat-bot/commit/4c4e400b5790e799b27bebffd3ba1d2082d23209) - Tests and bug fixes
- [258f0cc](https://github.com/Efreak/node-steam-chat-bot/commit/258f0cc0a48cba98b9eeecaba6578a8b71086695) - Remove bad info
- [f4d1d88](https://github.com/Efreak/node-steam-chat-bot/commit/f4d1d883315cdddb2f13860cbd26bbee3c8286ce) - Split README.md
- [ba9a501](https://github.com/Efreak/node-steam-chat-bot/commit/ba9a501818b40aa6b31e49480b3f95e38dab046a) - Fix infobot's !unlearn
- [dbfddfc](https://github.com/Efreak/node-steam-chat-bot/commit/dbfddfcaec2d85de8d54930859fe0d69455cd967) - Infobot no longer requires lowercase keys for "what is..."
- [59d2975](https://github.com/Efreak/node-steam-chat-bot/commit/59d2975f65efe234089757d0287fd22243186bd5) - Fix pushbullet
- [40e26c0](https://github.com/Efreak/node-steam-chat-bot/commit/40e26c0534e8a63b594f54c4dff45a1fc2bb6cce) - Dug out the firebaseTrigger changes from the trash, changed botCommandTrigger callbacks
- [2654912](https://github.com/Efreak/node-steam-chat-bot/commit/26549124cfd229336391de7c7c232c495b922812) - Fix broken JSON in package.json
- [9f92c4f](https://github.com/Efreak/node-steam-chat-bot/commit/9f92c4ff51ab9f2257e10e0f0a236bc59b1ad066) - Move some dependencies to optionalDependencies. Use `npm install steam-chat-bot --no-optional` to install only the core dependencies
- [4d081d0](https://github.com/Efreak/node-steam-chat-bot/commit/4d081d051f4df0691b8d08a144c8917708fd07a3) - Fix pushbullet default location
- [fa79e12](https://github.com/Efreak/node-steam-chat-bot/commit/fa79e123a40d36cdb45a47967cc7c59ef2de0c38) - Remove extra comma in package.json
- [f630776](https://github.com/Efreak/node-steam-chat-bot/commit/f6307765e9d7450d53154562c34e30eb6f6a2868), [220e19a](https://github.com/Efreak/node-steam-chat-bot/commit/220e19ae1b8c85930d14d41b398ba7f7216e7e59) - Rename pushbulletTrigger
- [bd2a080](https://github.com/Efreak/node-steam-chat-bot/commit/bd2a080e480dcb478c2d56567ef55be59cb72779) - Add email and message notifications 
- [1f86bc3](https://github.com/Efreak/node-steam-chat-bot/commit/1f86bc3b067371690458161ccd024a31f5039625) - Remove duplicate keyword
- [9a2ef2b](https://github.com/Efreak/node-steam-chat-bot/commit/9a2ef2b3b9b90054f0bdc14162620c3ebf54541b) - Add silly debugging to help find problems in triggers
- [2c84a1d](https://github.com/Efreak/node-steam-chat-bot/commit/2c84a1d3c14ed0f1b5b02313df3ac7e1f00ab16f) - Add changelog 
- [4f2205f](https://github.com/Efreak/node-steam-chat-bot/commit/4f2205f156daeb56aaf3465374136c5e7fc3c3f2) - Fix basetrigger
- [a4bc1e4](https://github.com/Efreak/node-steam-chat-bot/commit/a4bc1e427ff2e0dc80da600024187333149e094b) - Change 404 message for translateTrigger
- [18f519d](https://github.com/Efreak/node-steam-chat-bot/commit/18f519d568de3fc6445c70c0ca032e645542cbe3) - Finish notification triggers
- [58c0f47](https://github.com/Efreak/node-steam-chat-bot/commit/58c0f475a1edc334c512e6f68a4db8f0625ffd32), [43b1b82](https://github.com/Efreak/node-steam-chat-bot/commit/43b1b8297998107eb8025d972e1af1622228fb89) - Rename LinkName to LinkNameTrigger
- [ba5c77f](https://github.com/Efreak/node-steam-chat-bot/commit/ba5c77fc2766df267df43bc36afb8346f378f788) - Add support for custom args to pass to sendmail binary
- [1797df3](https://github.com/Efreak/node-steam-chat-bot/commit/1797df3a51a6e31653b016adf2c38e51df32f3b8) - Fix _onAnnouncement log spam if maingroup isn't defined
- [f9645b0](https://github.com/Efreak/node-steam-chat-bot/commit/f9645b062fe79e18adfedde40d88383ef5cf5d8f) - Fix nodemailer debug



[1.8.2 / 2015-05-17 - bugfix](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.8.2)
==================

- Fixed Pushbullet crashing the bot...oops.



[1.8.1 / 2015-05-17](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.8.1)
==================

- a10361a Update tags for pushbullet, etc
- 63ab0a0 Replace chatPmTrigger with an optional options.response="pm" or ="group" in chatReplyTrigger
- fc56e7a Move sendGreeting out of baseTrigger
- 0926858 readd untested makeAnnouncement function
- 44aeb5b notify live log viewers when they get disconnected from the server
- 7c5332f Fix crash on announcement
- Don't show web sessionID in log unless debugging enabled.
- Add doormatTrigger



[1.8.0 / 2015-05-13 - New Triggers!](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.8.0)
==================

- `LinkName`: Responds to posted links with their titles (i.e https://github.com will be responded with "GitHub, build better software, together")
- `ChatPmTrigger`: Responds to a certain message with a PM instead of in the group
- `DoormatTrigger`: Says "Hello user" (replace user with their name) when they join the chat



[1.7.0 / 2015-05-09 - Add some APIs](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.7.0)
==================

- New node-steam apis:
    - Add steam-trade dependency
    - Add an option for `maingroup` (will decide where the bot will show announcements from)(groupid) and    `acceptTrade` (will determine whether a bot will accept trade)(bool)
    - Listeners
        - onWebSessionID: log into steam web api)
        - onTradeOffer: received a trade offer)
        - onTradeProposed: someone proposed a trade to the bot)
        - onTradeResult: whether someone accepted a trade you sent them (i think)
        - onSessionStart: when the trade starts)
        - onAnnoucnement: when the `maingroup` posts an announcement
    - Methods
        - logOff: logs the bot off of steam
        - chatInvite(chatID, userID): invites `userid` to `chatid` group chat
        - getSteamLevel(array of steamids): gets the steam level for the array of steamids
        - setIgnoreFriend(steamID, bool): will determine whether `steamID`'s friend request is ignored
        - trade(steamID): sends a trade to `steamID`
        - respondToTrade(tradeID, bool): determines whether to respond to a specific trade, don't use this in the bot file
        - cancelTrade(steamID): will cancel a trade sent to a specific `steamID`
- 533d5c3 Don't show private messages in live log



[1.6.4 / 2015-05-03 - Fixes, fixes, fixes!](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.6.4)
==================

- Fix acceptFriendRequest not working



[1.6.3 / 2015-05-03 - More Fixes, Organization](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.6.3)
==================

- Fix OMDB year argument
- Moved examples to their own folder
- Rename LICENCE to LICENSE



[1.6.2 / 2015-05-03 - Bug Fixes](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.6.2)
==================

- Fix youtube typeerror
- Add pushbullet to package.json



[1.6.1 / 2015-04-30 - Fix Youtube](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.6.1)
==================

- Youtube updated their API to v3 and deprecated the v2 API. This release fixes that.



[1.6.0 / 2015-04-28 - APRIL FOOLS!](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.6.0)
==================

- Add contributors list & update package.json
- New trigger for translations with !translate and !languages
- fix for cleverbot
- Add collaborators :neckbeard:
- Update dependencies
- Add more triggers to readme.
- Add year argument to omdb trigger.
- Fix example configs.
- Rename isupTrigger to IsUpTrigger - if you're using this, you'll need to fix your config.
- This is totally not an April Fools' release. :innocent:



[1.5.0 / 2015-11-22](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.5.0)
==================

- Added !movies command

[1.4.5 / 2014-09-21](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.4.5)
==================

- Dependencies updated.
- Added project to [Codacy](http://www.codacy.com/) and updated code for a better score.

[1.4.4 / 2014-09-18](https://github.com/Efreak/node-steam-chat-bot/releases/tag/1.4.4)
==================

- I'm liable to forget that I want to do this, but it would likely be a nice idea to make a release ~1wk after every change that doesn't break anything.

[Pre-1.4.4](https://github.com/bonnici/node-steam-chat-bot)
==================
 - please see @bonnici's [original repo](https://github.com/bonnici/node-steam-chat-bot), as this is where it was forked.
