// This example demonstrates the usage of Firebase for storing trigger definitions.
//   https://www.firebase.com/docs/
// Before running the example, ensure the following env vars are set:
//   FIREBASE_URL, FIREBASE_SECRET
// It is recommended to disable public read/write to your firebase instance

// To run this example:
//  npm run-script example-firebase

// Allows you to define environment variables in a .env file located in the root directory of the project
//   https://www.npmjs.com/package/dotenv
// Do not ever commit .env
require('dotenv').config({silent: true});

var firebaseURL = process.env.FIREBASE_URL || "";
var firebaseSecret = process.env.FIREBASE_SECRET || "";

var when = require("when");
var ChatBot = require("../lib/chatBot").ChatBot;

var chatBotOptions = {
//	sentryFile: "",		//Bot tries to find a sentry file automatically. This is only required if you have one with a strange name, otherwise it's automatic.
    logFile: true,          //set to true to log to bot.$username.log, or define a custom logfile. Set to false if you don't want to log to file.
    autoReconnect: true,    //automatically reconnect to the server
    consoleTime: false,     //don't put timestamps in the console log, `heroku logs` shows them anyways
    consoleColors: false,   //don't use colors in the log. using `heroku logs` will be annoying.
    consoleLogLevel: "info" //don't log chatter to console, it's spammy. Only log warnings, errors, etc.
};

if(process.env.guardCode) {
    chatBotOptions.guardCode = process.env.guardCode;
}

var username = process.env.username || "";
var password = process.env.password || "";

var defaultTriggers = require("./example-config-triggers2");

prepareFirebase()
    .then(initBot)
    .catch(function(err) {
        console.error("chatbot init failure", err);
        process.exit();
    });

function prepareFirebase() {
    return when.promise(function(resolve, reject) {
        if (!firebaseURL || !firebaseSecret) {
            console.log("not using firebase");
            resolve(false);
        }

        var Firebase = require("firebase");
        var Fireproof = require("fireproof");
        Fireproof.bless(when);
        var fp = new Fireproof(new Firebase(firebaseURL));

        return fp.authWithCustomToken(firebaseSecret)
            .catch(function(err) {
                console.error("Firebase op failed", err);
                reject(err);
            })
            .done(function(authData) {
                console.log("Firebase login successful", authData);
                resolve(fp);
            });
    });
}

function initBot(fp) {
	var myBot = new ChatBot(username, password, chatBotOptions);

	if(fp) {
		fp = fp.ref();
		fp.child("triggers").on("value", function(triggerSnapshot) {
			if (triggerSnapshot.val()) {
				console.log("Received triggers from Firebase");
				myBot.clearTriggers();
				myBot.addTriggers(triggerSnapshot.val());
			} else {
				console.log("Received no triggers from Firebase, setting defaults");
				triggerSnapshot.ref().set(defaultTriggers);
			}
		});
		console.log("llama");
	} else {
		myBot.addTriggers(defaultTriggers);
	}
	console.log("connect");
	myBot.connect();
}

