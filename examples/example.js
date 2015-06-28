// To run this example without first copying it outside of node_modules/steam-chat-bot, use ./ as the require path, e.g.:
// var ChatBot = require("./").ChatBot
var ChatBot = require("steam-chat-bot").ChatBot;

// This will log in a steam user with the specified username and password 
// You can also pass in a steam guard code from an email
var myBot = new ChatBot("username", "password", {
	//this is required on the first run if you have steamguard enabled, but not after that.
	guardCode:        'XXXX',

	//the built-in webserver is enabled by default
	disableWebServer: false,

	//If you run steam-chat-bot as root, it will eat your babies. DO NOT RUN steam-chat-bot AS ROOT. Use nginx, lighttpd, or apache as a frontend webserver, or use iptables or your router to forward the port. DO NOT RUN AS ROOT!
	webServerPort:    8080,

	//file that contains which chats to join on connect
	autojoinFile:     "bot.username.autojoin",

	//Color logs in the console? errors are red, etc.
	consoleColors:    true,

	//timestamp logs in console?
	consoleTime:      true,

	//can also be error, debug, none, or other valid winston log levels. Mostly, only Error, Debug, Info get used. 
	logLevel:         "info",

	//can also be error or debug - only controls what gets logged to console; above controls the logfile.
	consoleLogLevel:  "info",

	//this does *not* log chatter. If you want to log chatter, use the logTrigger.
	logFile:          "bot.username.log",

	//this is your ssfn file. No, you can't actually use an ssfn file, and we won't help you try.
	//Bot tries to find a sentry file automatically. This is only required if you have one with a strange name, otherwise it's automatic.
	sentryFile:       "bot.username.sentry",

	//Why would you *not* want it to autoconnect?
	autoconnect:      true,

	//You probably want to set this to true, though...
	autoReconnect:    false,

	//the path to the favicon that will be used by your webserver
	//If you use a reverse proxy for logs, you'll need to make sure this gets passed along too (if you actually want it)
	favicon:          "htt://yourwebsite.com/favicon.ico",

	//log metadata about all http requests?
	httpLogMeta:      true,

	//format expressWinston logs the way it likes?
	httpFormat:       false,

	//that's 5 minutes, if you can't do math. The babysitter checks to make sure we're online if above is true.
	babysitTimer:     5*60*1000,

	//ignore these people for all triggers that don't explicitly *not* ignore them. (this way you can still log them)
	ignores: ['steamid64','steamid64','steamid64']
});

// Set up the triggers to control the bot
var triggers = require("./example-config-triggers");
myBot.addTriggers(triggers);

myBot.connect();

// Trigger details can be retrieved and reloaded so that external configuration can be supported
//var details = myBot.getTriggerDetails();
//myBot.clearTriggers();
//myBot.addTriggers(details);

//these are useful for displaying your bot as playing a game, so it shows up in the upper part of the userlist.
//this is a comma-separated array of games that the bot will play automatically on login. 440 is tf2.
//myBot.setGames([440]);
//this will stop all games, start the game listed (the first parameter), then after a delay in ms (the second param), start any games it was already playing. 570 is dota2.
//myBot.setPrimaryGame(570,250);
