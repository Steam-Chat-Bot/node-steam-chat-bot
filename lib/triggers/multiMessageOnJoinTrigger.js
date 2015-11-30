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
	//trigger.options.admins = trigger.options.admins || []; //not implemented yet.
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
	if(!this.db.groups) {
		this.db.groups = {};
	}
	if(!this.db.groups[toId]) { //initialize user database, it's easier this way so we don't have to do it on each individual function that needs it
		that.db.groups[toId] = {
			groupId: toId,
			admins: [],
			users: {},
			message: false,
			delay: 0,
			delayUnits: 'days'
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

	if(!(this.options.admins.indexOf(userId) > -1||this.db.groups[toId].indexOf(userId) > -1)) {
		return false; //only allow admins to use the commands. Don't bother with errors for non-admins.
	}
	var cmd = this._stripCommand(message,this.options.command);
	if (!cmd) {
		return false;
	}
	var tokens = cmd.split(' ');
	if(tokens[0]==="admin" && this.options.admins.indexOf(userId) > -1) {
		if(tokens[1]==="add") {
			this.db.groups[toId].admins.push(tokens[2]);
			this._sendMessageAfterDelay(toId,tokens[2]+" is now able to change the entry message in this chat");
			return true;
		}
		if(tokens[1]==="remove") {
			this.db.groups[toId].admins.splice(this.db.groups[toId].admins.indexOf(tokens[2]),1);
			this._sendMessageAfterDelay(toId,tokens[2]+" is no longer able to change the entry message in this chat");
			return true;
		}
	}
	if(tokens[0]==="delay") {
		if(!tokens[1]) {
			var msg = "Entry message will not be sent if user's last join was more than "+this.db.groups[toId].delay
				+" "+this.db.groups[toId].delayUnits+" ago.\nSet by: "+this._username(this.db.groups[toId].delayChanger)
				+"\nSet at: "+(new Date(this.db.groups[toId].delayDate)).toString();
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
		this.db.groups[toId].delay = parseInt(tokens[1]);
		this.db.groups[toId].delayUnits = tokens[2];
		this.db.groups[toId].delayChanger = userId;
		this.db.groups[toId].delayDate = new Date().getTime();
		var msg = "Entry message will not be sent if user's last join was more than "+this.db.groups[toId].delay
			+" "+this.db.groups[toId].delayUnits+" ago.\nSet by: "+this._username(this.db.groups[toId].delayChanger)
			+"\nSet at: "+Date(this.db.groups[toId].changeDate).toString();
		this._sendMessageAfterDelay(toId,msg);
		return true;
	}
	if(tokens[0]==="message") {
		if(!tokens[1]) {
			var msg = "Message: "+this.db.groups[toId].message
				+ "\n\nSet by: "+this._username(this.db.groups[toId].messageChanger)+" http://steamcommunity.com/profiles/"
				+ this.db.groups[toId].changer + "\nSet at: "+(new Date(this.db.groups[toId].messageDate)).toString()
				+ "To set a new message, please add it to the end of this command";
			this._sendMessageAfterDelay(userId,msg);
			return true;
		}
		this.db.groups[toId].messageDate = new Date().getTime();
		this.db.groups[toId].messageChanger = userId;
		tokens.splice(0,1);
		this.db.groups[toId].message = tokens.join(" ");
		this._sendMessageAfterDelay(toId,"Message set to: "+this.db.groups[toId].message);
		return true;
	}
	if(tokens[0]==="unset") {
		this.db.groups[toId].message = false;
	}
	return false;
}

MultiMessageOnJoinTrigger.prototype._stripCommand = function(message, command){
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return message.substring(command.length+1);
	}
	return false;
}
MultiMessageOnJoinTrigger.prototype._respondToEnteredMessage = function(roomId, userId) {
	this._initDB(roomId);
	var then = moment(this.db.groups[roomId].users[userId]);
	if(!then|| then.add(this.db.groups[toId].delay,this.db.groups[toId].delayUnits).isBefore(moment())) {
		var message = this.db.groups[toId].message;
		if(message) {
			var username = this._username(userId);
			message = message.replace(/\$username/g,username);
			this._sendMessageAfterDelay(userId,message);
			return true;
		}
	}
}

MultiMessageOnJoinTrigger.prototype._username = function(steamId) {
	if(this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates) {
		return this.chatBot.steamFriends.personaStates[steamId].player_name;
	}
	return steamId;
}
