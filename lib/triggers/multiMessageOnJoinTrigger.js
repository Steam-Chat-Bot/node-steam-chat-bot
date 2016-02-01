var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var fs = require('fs');
var moment = require('moment');
var fnd = require('filendir');
/*
Customizable entry messages for groups. Message can be changed on the fly, and admins can be added for individual groups.
command - string = all subcommands should start with this
admins - string, array of strings = these users are automatically administrators, are allowed to add new admins.
dbFile - database file. This is a flatfile containing json. Defaults to BOTNAME/TRIGGERNAME.db.
saveTime - int = how often (in milliseconds) to save the database to disk? Defaults to 5 hours (5*60*60*1000)

Commands
  - All commands are prefixed by the 'command' option, then a space
  - All commands are only usable by admins
  - All command work only in the groupchat they should apply to. No private commands.
command        - param         - function
admin add      - $steamid64    - adds $steamid64 to the admins list. Only usable by hardcoded admins
admin remove   - $steamid64    - removes $steamid64 from the admins list. Only usable by hardcoded admins.
delay          - $delay $units - if a user last joined within the past $delay $units, they won't be sent a message.
					If delay & units omitted, displays the delay
message        - $message      - sets the message for this chat. $username will be replaced with the user's name.
					If $message omitted, displays the message, who set it, and when.
unset          -               - unsets the message. You might prefer to set the delay instead.
*/

var MultiMessageOnJoinTrigger = function() {
	MultiMessageOnJoinTrigger.super_.apply(this, arguments);
};

util.inherits(MultiMessageOnJoinTrigger, BaseTrigger);

var type = "MultiMessageOnJoinTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new MultiMessageOnJoinTrigger(type, name, chatBot, options);
	trigger.options.admins = trigger.options.admins || []; //not implemented yet.
	trigger.options.dbFile = trigger.options.hasOwnProperty('dbFile') ? trigger.options.dbFile : chatBot.name + '/' + name + '.db';
	trigger.allowMessageTriggerAfterResponse = true;
	trigger.options.command = options.command || '!entry';
	trigger.options.saveTimer = trigger.options.saveTimer || 5*60*6000;
	trigger.db = (function(){try{return JSON.parse(fs.readFileSync(trigger.options.dbFile));}catch(err){return {}}})();
	trigger.respectsGlobalFilters = false;
	return trigger;
};

// Return true if a message was sent. Don't bother with private messages (lazy) since then we'd have to know which group
MultiMessageOnJoinTrigger.prototype._initDB = function(toId) {
	var that = this;
	if(!this.db.groups) {
		this.db.groups = {};
	}
	if(!this.db.groups[toId]) { //initialize user database, it's easier this way so we don't have to do it on each individual function that needs it
		var time = new Date().getTime();
		that.db.groups[toId] = {
			groupId: toId,
			admins: [],
			users: {},
			message: false,
			delay: 1,
			delayUnits: 'hours',
			enabledDate: time,
			delayDate: time,
			messageDate: time,
			enabledChanger: this.chatBot.steamClient.steamID,
			delayChanger: this.chatBot.steamClient.steamID,
			messageChanger: this.chatBot.steamClient.steamID
		};
	}
}

MultiMessageOnJoinTrigger.prototype._onLoad = function() {
	var that = this;
	if(that.options.saveTimer !== -1) {
		var timerid = setInterval(function(){
			try {
				that.winston.silly(that.chatBot.name+"/"+that.name+": Writing database to disk");
				if(!fnd.ws(that.options.dbFile,JSON.stringify(that.db))) { //this should be changed to a database soon.
					that.winston.error(that.chatBot.name+"/"+that.name+": Could not write database");
				} else {
					that.winston.debug(that.chatBot.name+"/"+that.name+": Database written to disk");
				}
			} catch(err) {
				that.winston.error(that.chatBot.name+"/"+that.name+": Error saving database to disk",err.stack);
			}
		},that.options.saveTimer);
		this.winston.silly(this.chatBot.name+"/"+this.name+": saveTimer id: "+timerid);
	}
	return true;
}

MultiMessageOnJoinTrigger.prototype._respondToChatMessage = function(toId, userId, message) {
	var that = this;
	this._initDB(toId);
	var gmsg = this.db.groups[toId]; //shortcut

	if(!(this.options.admins.indexOf(userId) > -1||gmsg.admins.indexOf(userId) > -1)) {
		return false; //only allow admins to use the commands. Don't bother with errors for non-admins.
	}

	var cmd = this._stripCommand(message,this.options.command);
	if (!cmd) {
		return false;
	}
	var tokens = cmd.split(' ');

	if(tokens[0]==="admin" && this.options.admins.indexOf(userId) > -1) {
		if(tokens[1]==="add") {
			gmsg.admins.push(tokens[2]);
			this._sendMessageAfterDelay(toId,tokens[2]+" is now able to change the entry message in this chat");
			return true;
		}
		if(tokens[1]==="remove") {
			gmsg.admins.splice(gmsg.admins.indexOf(tokens[2]),1);
			this._sendMessageAfterDelay(toId,tokens[2]+" is no longer able to change the entry message in this chat");
			return true;
		}
	}
	if(tokens[0]==="delay") {
		if(!tokens[1]) {
			var msg = "Entry message will not be sent if user's last join was less than "+gmsg.delay
				+" "+gmsg.delayUnits+" ago.\nSet by: "+this._username(gmsg.delayChanger)
				+" http://steamcommunity.com/profiles/"+gmsg.delayChanger
				+"\nSet at: "+(new Date(gmsg.delayDate)).toString();
			this._sendMessageAfterDelay(toId,msg);
			return true;
		}
		var durations = ["seconds","minutes","hours","days","weeks","months","years"];
		if(!tokens[2] || durations.indexOf(tokens[3]) > -1 || parseInt(tokens[1]).toString()!==tokens[1]) {
			var msg = "You need to specify a number and a unit. For example, '7 hours'. Valid units of time are: "
				+durations.join(", ");
			this._sendMessageAfterDelay(toId,msg);
			return true;
		}
		gmsg.delay = parseInt(tokens[1]);
		gmsg.delayUnits = tokens[2];
		gmsg.delayChanger = userId;
		gmsg.delayDate = new Date().getTime();
		var msg = "Entry message will not be sent if user's last join was less than "+gmsg.delay
			+" "+gmsg.delayUnits+" ago.\nSet by: "+this._username(gmsg.delayChanger)
			+"\nSet at: "+Date(gmsg.changeDate).toString();
		this._sendMessageAfterDelay(toId,msg);
		return true;
	}
	if(tokens[0]==="message") {
		if(!tokens[1]) {
			var msg = "Message: "+gmsg.message
				+ "\n\nSet by: "+this._username(gmsg.messageChanger)+" http://steamcommunity.com/profiles/"
				+ gmsg.messageChanger + "\nSet at: "+(new Date(gmsg.messageDate)).toString()
				+ "To set a new message, please add it to the end of this command";
			this._sendMessageAfterDelay(userId,msg);
			return true;
		}
		gmsg.messageDate = new Date().getTime();
		gmsg.messageChanger = userId;
		tokens.splice(0,1);
		gmsg.message = tokens.join(" ");
		this._sendMessageAfterDelay(toId,"Message set to: "+gmsg.message);
		return true;
	}
	if(tokens[0]==="unset") {
		gmsg.message = false;
		gmsg.messageDate = new Date().getTime();
		gmsg.messageChanger = userId;
		this._sendMessageAfterDelay(toId,"Message unset");
	}
	if(tokens[0]==="enabled") {
		var str;
		if(tokens[1] && ["y","t"].indexOf(tokens[1][0].toLowerCase()) > -1) {
			gmsg.enabled=true;
			gmsg.enabledDate = new Date().getTime();
			gmsg.enabledChanger = userId;
		} else if(tokens[1] && ["n","f"].indexOf(tokens[1][0].toLowerCase()) > -1) {
			gmsg.enabled=false;
			gmsg.enabledDate = new Date().getTime();
			gmsg.enabledChanger = userId;
		}
		var msg = "Entry messages for this chat were " + (gmsg.enabled ? "enabled" : "disabled") + " by "
			+ this._username(gmsg.enabledChanger)+" http://steamcommunity.com/profiles/"
			+ gmsg.enabledChanger + " at "+(new Date(gmsg.enabledDate)).toString();
		this._sendMessageAfterDelay(toId,str);
		return true;
	}
	return true;
}

MultiMessageOnJoinTrigger.prototype._stripCommand = function(message, command){
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return message.substring(command.length+1);
	}
	return false;
}
MultiMessageOnJoinTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	this._initDB(roomId);
	var gmsg = this.db.groups[roomId]; //shortcut

	var delay = gmsg.delay;
	var then = moment(gmsg.users[userId]);
	var message = gmsg.message;

	if(!message) {
		return false;
	}
	if(!delay || !then || then.add(gmsg.delay,gmsg.delayUnits).isBefore(moment())) {
		var username = this._username(userId);
		message = message.replace(/\$username/g,username);
		this._sendMessageAfterDelay(userId,message);
	}
	gmsg.users[userId] = new Date().getTime();
	return true;
}

MultiMessageOnJoinTrigger.prototype._username = function(steamId) {
	if(this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates) {
		return this.chatBot.steamFriends.personaStates[steamId].player_name;
	}
	return steamId;
}
