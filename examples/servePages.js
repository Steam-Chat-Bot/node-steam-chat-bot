//This file contains info used for setting up a bot that also runs the built-in webserver

var ChatBot = require("steam-chat-bot").ChatBot;
var myBot = new ChatBot("username", "password", {
	guardCode:        'XXXX', disableWebServer: false,
	webServerPort:    8080,   favicon: "htt://yourwebsite.com/favicon.ico",
	httpLogMeta:      true,   httpFormat:       false });
var triggers = require("./example-config-triggers");
myBot.addTriggers(triggers);
myBot.connect();




//webserver stuff
//the router object is an instance of an ExpressJS router.
var server = myBot.router;

//redirect a page with a statuscode
server.get('/redirect', function(req, res) {
	res.redirect(301,"http://example.com");
});

//send a page that's created on the fly
//Eventually this function will be added to infoTrigger. In the mean time, it's here.
server.get('/uptime', function(req, res) {
	//functions for converting
	var _nanosecondsToStr = function(seconds, goagain) {
		var temp = seconds; var next; function numberEnding (number) {return (number > 1) ? "s" : "";}
		if(temp > 259200) { temp = Math.floor(temp / 86400); next = (goagain===true ? this._nanosecondsToStr(seconds-temp*86400,false) : ""); return " " + temp + " day" + numberEnding(temp) + next;
		} else if (temp > 10800) { temp = Math.floor(temp / 3600); next = (goagain===true ? this._nanosecondsToStr(seconds-temp*3600,false) : ""); return " " + temp + " hour" + numberEnding(temp) + next;
		} else if (temp > 180) { temp = Math.floor(temp / 60); next = (goagain===true ? this._nanosecondsToStr(seconds-temp*60,false) : ""); return " " + temp + " minute" + numberEnding(temp) + next;
		} else { return (goagain===true ? " less than a minute" : "");}
	}
	var _bytesToSize = function(bytes) {
		var sizes = ["Bytes", "KB", "MB", "GB", "TB"]; if (bytes === 0) { return "0 Byte"; } var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024))); return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
	};
	//create status report
	var message = "I have been running for about " + this._nanosecondsToStr(Math.floor(curtime/1000000000));
	message += " on " + process.platform + "/" + process.arch;
	message += ", using " + this._bytesToSize(meminfo.heapUsed) + " of " + this._bytesToSize(meminfo.heapTotal) + " allocated memory (RSS: " + this._bytesToSize(meminfo.rss);
	message += "). Node.js version is "+process.version+".";
	//send status report to browser
	res.send(message);
});

//this function is already implemented by the logTrigger, but it can be adapter to seve a different directory
var sindex = require('serve-index'); //this module is already required by the bot, you don't need to install it manually.
var index = sindex(that.options.logDir,{"icons":true,filter:function(f, i, fs, d){
	if (f.substring(0,that.options.prefix[0].length) === that.options.prefix[0]) {
		return false;
	} else {
		return true;
	}
}});
server.use("/logs", index);
