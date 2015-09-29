var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
/*
 Trigger that responds to messages with the amount of time the bot script has been running, adn some other useful info
 command = string - What is the command. - defaults to !botinfo
 */

var InfoTrigger = function() {
	InfoTrigger.super_.apply(this, arguments);
};

util.inherits(InfoTrigger, BaseTrigger);

var type = "InfoTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new InfoTrigger(type, name, chatBot, options);
	trigger.options.command = trigger.options.command || "!botinfo";
	trigger.startTime = process.hrtime();
	return trigger;
};

// Return true if a message was sent
InfoTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
InfoTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

InfoTrigger.prototype._respond = function(toId, msg) {
	if (this.options.command && msg && msg.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
		var meminfo = process.memoryUsage();
		var curtime = process.hrtime(this.startTime);
			curtime = curtime[1] + curtime[0]*1000000000;
		var message = "I have been running for" + this._nanosecondsToStr(Math.floor(curtime/1000000000), true);
			message += " on " + process.platform + "/" + process.arch;
			message += ", using " + this._bytesToSize(meminfo.heapUsed) + " of " + this._bytesToSize(meminfo.heapTotal) + " allocated memory (RSS: " + this._bytesToSize(meminfo.rss);
			message += "). Node.js version is "+process.version+". Bot version is "+(this.chatBot.version.string || this.chatBot.version.short)+".";
			this._sendMessageAfterDelay(toId,message);
		return true;
	}
	return false;
}

InfoTrigger.prototype._nanosecondsToStr = function(seconds, goagain) {
    var temp = seconds; var next;
    function numberEnding (number) {return (number > 1) ? "s" : "";}

    if(temp > 259200) {
        temp = Math.floor(temp / 86400);
        next = (goagain===true ? this._nanosecondsToStr(seconds-temp*86400,false) : "");
        return " " + temp + " day" + numberEnding(temp) + next;
    } else if (temp > 10800) {
        temp = Math.floor(temp / 3600);
        next = (goagain===true ? this._nanosecondsToStr(seconds-temp*3600,false) : "");
        return " " + temp + " hour" + numberEnding(temp) + next;
    } else if (temp > 180) {
        temp = Math.floor(temp / 60);
        next = (goagain===true ? this._nanosecondsToStr(seconds-temp*60,false) : "");
        return " " + temp + " minute" + numberEnding(temp) + next;
    } else {
		return (goagain===true ? " less than a minute" : "");
	}
}
InfoTrigger.prototype._bytesToSize = function(bytes) {
    var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) {
		return "0 Byte";
	}
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
};
