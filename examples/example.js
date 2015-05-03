// To run this example without first copying it outside of node_modules/steam-chat-bot, use ./ as the require path, e.g.:
// var ChatBot = require("./").ChatBot
var ChatBot = require("steam-chat-bot").ChatBot;

// This will log in a steam user with the specified username and password 
// You can also pass in a steam guard code from an email
var myBot = new ChatBot("username", "password", {
//	sentryFile: "",		//Bot tries to find a sentry file automatically. This is only required if you have one with a strange name, otherwise it's automatic.
//	guardCode: "",		//guardCode will override a sentry file. Comment this out after the first use.
	logFile: true,		//set to true to log to bot.$username.log, or define a custom logfile. Set to false if you don't want to log to file.
	autoReconnect: true,	//automatically reconnect to the server
	babysitTimer: 300000
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
