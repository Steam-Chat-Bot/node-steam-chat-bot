//This file is really only here because without a .js file in root, codacy doesn't work.
//This file will *not* be kept up to date. Please use the examples from the examples folder.

var ChatBot = require("steam-chat-bot").ChatBot;

var myBot = new ChatBot("sillysteambot", "password", {
	autoReconnect: true,	//automatically reconnect to the server
	webServerPort:8000
});

var triggers = require("./example-config-triggers");
myBot.addTriggers(triggers);

myBot.connect();
