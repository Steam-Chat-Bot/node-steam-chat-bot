//the groupNames are easily readable below and easy to use in config (rooms.name), but for internal use in actual modules the format should be reversed (`for (var room in roomNames){ log.name=roomNames[room]; }`)
var reverseObject = function(object) {
	var newObj = {};
	for(var key in object) {
		if(!newObj[object[key]] || key.length > newObj[object[key]].length) { //also, I want something shorter than the full group name, but I don't wanna bother with keeping logfiles up to date. So when the group name is long, I can just stick it in there multiple times to shorten it, but the longer one will still be used internally
			newObj[object[key]] = key;
		}
	}
	return newObj;
}

//roomNames are used by several triggers, but mainly logTrigger (for filenames and webview). Not all of these chats are used anymore.
var rooms = {
//reddit chats
	Reddit:				'103582791429796426', // Permission from ??? can't remember. Has since been blocked/banned due to abuse, but still listed.
	'Reddit Games':			'103582791434253499', // Permission from ??? can't remember.
	rg:				'103582791434253499', // ^
	'/r/SGS':			'103582791432826618', // Permission from blueshiftlabs via reddit, contact = puck &c.
	sgs:				'103582791432826618', // ^
//various chats
	Hookups:			'103582791432502936', // Requested by https://steamcommunity.com/profiles/76561198011647032/
	BLG:				'103582791433859404', // Backlog Gaming. Permission from seph? can't remember.
	BraveSpirits:			'103582791436428985', // Requested by https://steamcommunity.com/profiles/76561198119588813
	Chlorique:			'103582791436501299', // Chlorique. Duh.
	tknights:			'103582791438401769', // contacts: grizzly https://steamcommunity.com/profiles/76561198047371731 
	'Trivia Knights':		'103582791438401769', // ^ ...and nasty: https://steamcommunity.com/profiles/76561198018527807
	IGB:				'103582791432907531', // IGBWiki, permission from seph.
//opium pulses groups, all joined by request, can't remember who. Contacts: slipslot, baertel, lewis. group admins I know are listed below.
	OPGiveaways:			'103582791432751135', // ^ slipslot    https://steamcommunity.com/profiles/76561198057252542/
	OPG:				'103582791432751135', // ^ baertel     https://steamcommunity.com/profiles/76561198057380644/
	TradingAroundTheWorld:		'103582791433870096', // ^ manc        https://steamcommunity.com/profiles/76561198012794916/
	OpiumTrading:			'103582791433402816', // ^ adrian      https://steamcommunity.com/profiles/76561198022422924/
	OPSavings:			'103582791434485851', // ^ lewis       https://steamcommunity.com/profiles/76561198057322285/
	OPS:				'103582791434485851', // ^ sagittarius https://steamcommunity.com/profiles/76561198028623034/
	OPT:				'103582791433870096', // ^ shortcut
	OPT2:				'103582791433402816', // ^ shortcut. Why does OP need TWO trading groups?
	'Gift of Games':		'103582791436617779', // reddit gift of games. Permission from Aakash http://steamcommunity.com/profiles/76561198034107051/
	'/r/GOG':			'103582791436617779', // ^shortcut
	rGOG:				'103582791436617779', // ^shortcut
	gog:				'103582791436617779', // ^shortcut
	'Phoenix Council':		'103582791439828295', // Maester Mika http://steamcommunity.com/profiles/76561198085353243/
//And my chats, of course
	DLCGiveaways: '103582791434235788', DLCG: '103582791434235788', Freaktopia: '103582791433451569', YCJGTFO: '103582791433731577', botDev: '103582791438731217', 'Chat Bot Dev & Testing': '103582791438731217'
}
var roomNames = reverseObject(rooms); //now reverse the object so it can be used by roomNames

var users = {
	efreak: '76561198008335925',	chlor: '76561198068929225',	eterna: '76561198099203353',	slipslot: '76561198057252542',
	lewislol: '76561198057322285',	sagit: '76561198028623034',	baertel: '76561198057380644',	lastbullet: '76561198054239317',
	penny: '76561198058593967',	grizzly: '76561198047371731',	nasty: '76561198018527807',	husky: '76561198057012202',
	chip: '76561198058003981',	emily: '76561198034699157',	nonos: '76561198029074027',	norma: '76561198036715264',
	boar: '76561198065045875',	slipslot: '76561198057252542',	baertel: '76561198057380644',	manc: '76561198012794916',
	adrian: '76561198022422924',	lewis: '76561198057322285',	sag: '76561198028623034',	aakash: '76561198034107051',
	mika: '76561198085353243'
}

var assholes = { //I can't report you to steamrep for spamming, but I will add you to my asshole list.
	darkonion: '76561198041977869',	//abusing infobot, spamming
	halo: '76561197999716804',	//abusing infobot, spamming
	crowley: '76561197986549862',	//abusing !roll
	TheAzureDragon:"76561198086341931",		//abusing !randomgame
	sddsddcp:"76561198140044938",			//abusing !randomgame
	Miniboyss:"76561198068541106",			//abusing !randomgame
	"White Wolf":"76561198142690154",		//abusing !randomgame
	NEO:"76561198074201273",			//abusing !randomgame
	Preacher:"76561198180424210",			//abusing !randomgame
	ke7:"76561198083985186",			//abusing !randomgame
	"The Green Teabagger":"76561198087674442",	//abusing !randomgame
}

var trustedBots = { //these bots are so-called 'trusted' because they won't be checked for having bad profiles, as they're bots, not people.
	BansheeKeyBot: '76561198233180832',	//Banshee
	NewTrierBot: '76561198164977236',	//Banshee
	Dellatrix: '76561198190392221',		//BeautifulShrill
	'/r/SGS Bot': '76561198055589142',	//Efreak
	Zay: '76561198212058096',		//??
	MariePoppo: '76561198240914582',	//??
	Miley: '76561198055685680'		//Efreak
}
var otherBots = { //these bots are also ignored, but they're not trusted, so not added to trustedbots. If you know who owns any given bot, please let me know.
	//if you invite any of these bots to the bot dev for something other than dev-related discussion, they will be banned. So will you if we find out who you are.
	lewdbot: '76561198178278582',
	'0x0bf3f39': '76561198107682909',
	aoi2: '76561198157712509',
	aoi: '76561198065031569'
}
var globalIgnores = []; //generate the global ignores list by adding everyone from the 'asshole' list. This list is used on all 3 bots.
for(var name in assholes) {
	globalIgnores.push(assholes[name]);
}
for (var bot in trustedBots) { //Let i.imgur.com/GR3aU0N.png be a lesson to you: Make your bots ignore all the other bots lest they get in feedback loops. This one went on for nearly 20 minutes. i.imgur.com/3WsfhCb.png
	globalIgnores.push(trustedBots[bot]);
}
for (var bot in otherBots) {
	globalIgnores.push(otherBots[bot]);
}
//ignoredBots is basically bots that will be ignored by my bots. Feel free to steal this code. ignoredBots get added to global ignores. There's also a function for admins (me) to add other bots (or annoying users) to the list with.
var fs = require('fs');
var ignoredBots = (function(){try {return JSON.parse(fs.readFileSync('bots.json'));}catch(err){return {}}})();
for(var bot in ignoredBots) {
	globalIgnores.push(ignoredBots[bot].id);
}
var addbot = function(chatBot,data) {
	var info = data.message.match(/\!addbot[\s+]?([0-9]+)[\s+]?(.+)/)
	if(!info || info.index!==0) {
		chatBot.sendMessage(data.toId,"Bot id and comment required");
		return;
	}
	data.comment = info[2];
	data.botId = info[1];
	chatBot.ignores.push(data.botId);
	var ignoredBots = (function(){try {return JSON.parse(fs.readFileSync('bots.json'));}catch(err){return {}}})();
	ignoredBots[data.fromId] = data;
	ignoredBots[data.fromId].time = (Date()-0);
	fs.writeFileSync('bots.json',JSON.stringify(ignoredBots));
	chatBot.sendMessage(data.toId, data.botId+" has been added as a bot. I will not respond to any input from them.");
}
var imabot = function(chatBot,data) {
	var info = data.message.match(/\!addbot[\s+]?(.+)/)
	if(!info || info.index!==0) {
		chatBot.sendMessage(data.toId,"You need to have a comment saying who owns you. Please include the steamid64 of your owner/admin");
		return false;
	}
	chatBot.ignores.push(data.fromId);
	var ignoredBots = (function(){try {return JSON.parse(fs.readFileSync('bots.json'));}catch(err){return {}}})();
	data.time = (Date()-0);
	data.botId = data.fromId;
	data.comment = info[1]
	ignoredBots[data.fromId] = data;
	fs.writeFileSync('bots.json',JSON.stringify(ignoredBots));
	chatBot.sendMessage(data.toId,"You have been added as a bot. I will not respond to any more input from you.");
}
module.exports = {
	reverseObject: reverseObject,
	rooms: rooms,
	roomNames: roomNames,
	users: users,
	assholes: assholes,
	trustedBots: trustedBots,
	otherBots: otherBots,
	globalIgnores: globalIgnores,
	ignoredBots: ignoredBots,
	addbot: addbot,
	imabot: imabot
}
