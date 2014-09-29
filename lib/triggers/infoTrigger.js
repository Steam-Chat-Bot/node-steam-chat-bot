var util = require('util');
var winston = require('winston');
var BaseTrigger = require('./baseTrigger.js').BaseTrigger;
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

InfoTrigger.prototype._respond = function(toId, message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) == 0) {
		var meminfo = process.memoryUsage();
		var curtime = process.hrtime(this.startTime);
			curtime = curtime[1] + curtime[0]*1000000000;
		var message  = "I have been running for about " + this._nanosecondsToStr(curtime);
			message += " on " + process.platform + "/" + process.arch;
			message += ", using " + this._bytesToSize(meminfo.heapUsed) + " of " + this._bytesToSize(meminfo.heapTotal) + " allocated memory (RSS: " + this._bytesToSize(meminfo.rss);
			message += "). Node.js version is "+process.version+".";
			this._sendMessageAfterDelay(toId,message);
		return true;
	}
	return false;
}

InfoTrigger.prototype._nanosecondsToStr = function(nanoseconds) {
	var milliseconds = Math.floor(nanoseconds/1000000);
    function numberEnding (number) {return (number > 1) ? 's' : '';}
    var temp = Math.floor(milliseconds / 1000);
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) return days + ' day' + numberEnding(days);
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) return hours + ' hour' + numberEnding(hours);
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) return minutes + ' minute' + numberEnding(minutes);
    var seconds = temp % 60;
    if (seconds) return seconds + ' second' + numberEnding(seconds);
    return 'less than a second'; //'just now' //or other string you like;
}

InfoTrigger.prototype._bytesToSize = function(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};