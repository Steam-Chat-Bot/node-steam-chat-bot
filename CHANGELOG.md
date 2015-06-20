
###Development
- Convert pushbullet to a more general notification trigger
  - Add private message and email notifications
- d6520cfa249d3a010b2e079f780707e70ba8e609 Add LinkName trigger
- Lots of bugfixes
- Pushbullet enhancements
- Split README in two
- Create website (incomplete)
- Fix infobot's !unlearn
- 40e26c0534e8a63b594f54c4dff45a1fc2bb6cce Add Firebase example config
- 9f92c4ff51ab9f2257e10e0f0a236bc59b1ad066 Move most dependencies to optionalDependencies
- 9a2ef2b3b9b90054f0bdc14162620c3ebf54541b Add more debugging stuff for plugins so laziness doesn't hurt quite as much.
- 0365f864c36e043fc08301cf28485a358ccb9410, 37c1da5bfa2eb64ee774d8a2045fd712bf729030 Move webserver from logTrigger to chatBot.

##### Sections below this are likely to be incomplete. Sections above this should be more specific than the release notes.

###1.8.2 - bugfix
#### May 17, 2015
- Fixed Pushbullet crashing the bot...oops.

### 1.8.1
#### May 17 2015
- a10361a90d0ff2177b06e843ea8fdcebc6622973 Update tags for pushbullet, etc
- 63ab0a0f646da08fee3b30334fb70d62f1da86a6 Replace chatPmTrigger with an optional options.response="pm" or ="group" in chatReplyTrigger
- fc56e7aadda56931a1f85a75d8d9c0d7ebe16436 Move sendGreeting out of baseTrigger
- 0926858ae9353dd1837fa45c8dbe28aacd6c7e94 readd untested makeAnnouncement function
- 44aeb5b46fec4e20bc8f408a08f8d847d0a23490 notify live log viewers when they get disconnected from the server
- 7c5332f3b43ce44f86921acbb0383afde808b59b Fix crash on announcement
- Don't show web sessionID in log unless debugging enabled.
- Add doormatTrigger
- 

### 1.8.0 New Triggers!
#### May 13 2015
- `LinkName`: Responds to posted links with their titles (i.e https://github.com will be responded with "GitHub, build better software, together")
- `ChatPmTrigger`: Responds to a certain message with a PM instead of in the group
- `DoormatTrigger`: Says "Hello user" (replace user with their name) when they join the chat



###1.7.0 Add some APIs
#### May 9 2015
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
- Don't show private messages in live log (https://github.com/Efreak/node-steam-chat-bot/commit/533d5c307ff52125c3711d28f7ee2e5a5147a02a)



###1.6.4 Fixes, fixes, fixes!
#### May 3 2015
- Fix acceptFriendRequest not working



###1.6.3 More Fixes, Organization
####May 3, 2015
- Fix OMDB year argument
- Moved examples to their own folder
- Rename LICENCE to LICENSE



###1.6.2 Bug Fixes
####May 3, 2015
- Fix youtube typeerror
- Add pushbullet to package.json



###1.6.1 Fix Youtube
####Apr 30, 2015
- Youtube updated their API to v3 and deprecated the v2 API. This release fixes that.



###1.6.0 APRIL FOOLS!
####Mar 28, 2015
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



### 1.5.0
#### Nov 22, 2014
- Added !movies command
