var util = require("util");
var PushBullet = require("pushbullet");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var _=require("underscore");
/*
A Pushbullet trigger. Notify anyone who wants of anything they want. Basically, if a keyword is in a message, it gets sent to their pushbullet.
*/

var PushbulletTrigger = function() {
	PushbulletTrigger.super_.apply(this, arguments);
};

util.inherits(PushbulletTrigger, BaseTrigger);

var type = "PushbulletTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var admins = trigger.options.admins || [];
	var trigger = new PushbulletTrigger(type, name, chatBot, options);
	trigger.options.cmd  = trigger.options.hasOwnProperty("cmd") ? trigger.options.cmd : "!pb";
	trigger.options.banned = trigger.options.banned || [];
	trigger.options.dbFile = trigger.options.hasOwnProperty('dbFile') ? trigger.options.dbFile : "pb.db";
	trigger.options.noteTitle=trigger.options.hasOwnProperty("noteTitle") ? trigger.options.noteTitle : "Steam message from $username in $group!";
	trigger.dbInitialized=false;
	trigger.db = (function(){try{return JSON.parse(fs.readFileSync(trigger.options.dbFile));}catch(err){return {}}})();
	return trigger;
};

/* db initialization will go here
PushbulletTrigger.prototype._onLoad = function(){
        console.log("onload");
	return true;
}
*/
PushbulletTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
PushbulletTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

PushbulletTrigger.prototype._respond = function(toId,userId,message) {
	var that = this;
	if(this.options.cmd && message.toLowerCase().indexOf(this.options.cmd)===0) {
		var line = this._stripCommand(message, this.options.cmd);
		if(line == "delete yes") {
			delete that.db[userId];
			that._sendMessageAfterDelay(userId,"Your settings have been deleted");
		} else if(line == "delete") {
			that._sendMessageAfterDelay(userId,"Are you sure you want to delete your settings? If so, please add 'yes' to the end of this command.");
		} else if(line == "devices" && that.db[userId] && that.db[userId].apikey) {
			var pusher = new PushBullet(that.db[userId].apikey);
			pusher.devices(function(error, response){
				if(error) {
					that.winston.debug(error);
					that._sendMessageAfterDelay(userId,"An error has occurred! It has been logged.");
				} else {
					if(response.devices.length=0) {
						that._sendMessageAfterDelay(userId,"You have no devices!");
					}
					var rsp = response.devices.length +" devices:";
					for(x=0;x<response.devices.length;x++) {
						rsp+="\nNickname: \""+response.devices[x].nickname+"\"";
						rsp+="   Iden: "+response.devices[x].iden;
					}
					that._sendMessageAfterDelay(userId,rsp);
				}
			});
		} else if (that._stripCommand(line, "apikey")) {
			var apikey = that._stripCommand(line, "apikey");
			var pusher = new PushBullet(apikey);
			pusher.me(function(err,response){
				if(err) {
					that.winston.debug(err);
					that._sendMessageAfterDelay(userId,"An error has occurred! It has been logged. Most likely you have entered a bad API key.");
				} else {
					if(!that.db[userId]) that.db[userId]={};
					that.db[userId].apikey=apikey;
					if(!response.name) {
						that._sendMessageAfterDelay(userId,"That API key is valid! It has been saved.");
					} else {
						that._sendMessageAfterDelay(userId,"Welcome, "+response.name+". Your API key has been saved");
					}
				}
			});
		} else if (this._stripCommand(line, "filter") && that.db[userId] && that.db[userId].apikey) {
			if(!that.db[userId].keys) that.db[userId].keys=[];
			//when a message contains a filtered word, we send it to their device(s).
			if (line=="filter list") {
				//list current filters
				that._sendMessageAfterDelay(userId,"\""+that.db[userId].keys.join("\",\"")+"\"");
			} else if (this._stripCommand(line, "filter add")) {
				//add a filter
				that.db[userId].keys.push(this._stripCommand(line, "filter add").toLowerCase());
			} else if (this._stripCommand(line, "filter remove")) {
				//remove a filter
				that.db[userId].keys.pop(that.db[userId].keys.indexOf(this._stripCommand(line, "filter remove")));
			} else that._sendMessageAfterDelay(userId,"Valid filter commands are 'list', 'add', and 'remove'.");
		} else if (this._stripCommand(line, "send") && that.db[userId] && that.db[userId].apikey) {
			var pusher=new PushBullet(that.db[userId].apikey);
			pusher.note(that.db[userId].deviceName,"Steam bot test",that._stripCommand(line,'send') || "This is a test message, sent to ensure your pushbullet settings in node-steam-chat-bot are correct.");
		}else {
			that._sendMessageAfterDelay(userId,"Either you're sending an invalid command, or I don't have an API key for you!\nValid subcommands are: 'filter', 'delete', 'send', and 'apikey'");
		}
		if(this.db[userId]) fs.writeFileSync(this.options.dbFile,JSON.stringify(this.db));
		return true;
	} else {
		var msg = message.toLowerCase();
		// now we get to parse all configured filters. WHEE!
		for(x=0; x<that.options.banned.length;x++) {
			if(msg.indexOf(that.options.banned[x].toLowerCase())>-1) return false;
		}
		_.each(that.db, function(user) { //need to add a link checker in here. If there's a URL in the message, we should send it as a link, not a note.
			if(!user.keys || !user.apikey) return false;
			for(x=0;x<user.keys.length;x++) {
				if(msg.indexOf(user.keys[x])>=0) {
					that.winston.debug("Sending pusbullet for "+userId);
					var pusher=new PushBullet(user.apikey);
					var msg = message.split('$username').join(that._username(userId)+"/"+userId);
					msg = msg.split('$group').join(toId);
					pusher.note(user.deviceName,that.options.noteTitle,msg);
				}
			}
		});
		return false;
	}
}

PushbulletTrigger.prototype._stripCommand = function(message, command){
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return message.substring(command.length+1);
	}
	return false;
}

PushbulletTrigger.prototype._username = function(userId) {
	return ((this.chatBot.steamClient.users && steamId in this.chatBot.steamClient.users) ? this.chatBot.steamClient.users[steamId].playerName : steamId)
}
