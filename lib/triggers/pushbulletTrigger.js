var util = require("util");
var PushBullet = require("pushbullet");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
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
	var trigger = new PushbulletTrigger(type, name, chatBot, options);
	trigger.options.cmd  = trigger.options.hasOwnProperty("cmd") ? trigger.options.cmd : "!pb";
//	trigger.db = options.ueberDB || new ueberDB.database("sqlite", {filename:options.dbFile||(chatBot.username+"/"+name+".db")}, {writeInterval:500});
	trigger.options.dbFile = trigger.options.hasOwnProperty('dbFile') ? trigger.options.dbFile : "pb.db";
	trigger.options.noteTitle=trigger.options.hasOwnProperty("noteTitle") ? trigger.options.noteTitle : "You've got a message on steam!";
	trigger.dbInitialized=false;
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
	this.db = function(){try{return JSON.parse(fs.readFileSync(trigger.options.dbFile));}catch(err){return {}}};
	if(this.options.cmd && message.toLowerCase().indexOf(this.options.cmd)===0) {
		var line = this._stripCommand(message, this.options.cmd);
		if(!line) return false;
		if(this._stripCommand(line, "devices") && that.db[userId] && that.db[userId].apikey) {
			var pusher = new PushBullet(that.db[userId].apikey);
			pusher.devices(function(error, response){
				if(error) {
					that.winston.debug(error);
					that._sendMessageAfterDelay("An error has occurred! It has been logged.");
				} else {
					if(response.devices.length=0) {
						that._sendMessageAfterDelay("You have no devices!");
					}
					var rsp = response.devices.length +" devices:";
					for(x=0;x<response.devices.length;x++) {
						rsp+="\nNickname: \""+response.devices[x].nickname+"\"";
						rsp+="   Iden: "+response.devices[x].iden;
					}
					that._sendMessageAfterDelay(rsp);
				}
			});
		} else if (this._stripCommand(line, "apikey") && that.db[userId]) {
			var apikey = that._stripCommand(line, "apikey");;
			var pusher = new PushBullet(apikey);
			pusher.me(function(err,response){
				if(err) {
					that.winston.debug(error);
					that._sendMessageAfterDelay("An error has occurred! It has been logged. Most likely you have entered a bad API key.");
				} else {
					if(!that.db[userId]) that.db[userId]={};
					that.db[userId].apikey=apikey;
					if(!response.name) {
						that._sendMessageAfterDelay("That API key is valid! It has been saved.");
					} else {
						that._sendMessageAfterDelay("Welcome, "+response.name+". Your API key has been saved");
					}
				}
			});
		} else if (this._stripCommand(line, "filter") && that.db[userId] && that.db[userId].apikey) {
			//when a message contains a filtered word, we send it to their device(s).
			if (this._stripCommand(line, "list")) {
				//list current filters
				that._sendMessageAfterDelay("\""+that.db[userId].keys.join("\",\"")+"\"");
			} else if (this._stripCommand(line, "add")) {
				//add a filter
				that.db[userId].keys.push(this._stripCommand(line, "add"));
			} else if (this._stripCommand(line, "remove")) {
				//remove a filter
				that.db[userId].keys.pop(that.db[userId].keys.indexOf(this._stripCommand(line, "remove")));
			}
		} else if (this._stripCommand(line, "send") && that.db[userId] && that.db[userId].apikey) {
			var pusher=new PushBullet(that.db[x].apikey);
			pusher.note(that.db[x].deviceName,"Steam bot test","This is a test message, sent to ensure your pushbullet settings in node-steam-chat-bot are correct.");
		}
		if(this.db[userId]) fs.writeFileSync(this.options.dbFile,JSON.stringify(this.db));
		return true;
	} else {
		var msg = message.toLowerCase();
		// now we get to parse all configured filters. WHEE!
		for(x=banned; x<banned.length;x++) {
			if(msg.indexOf(banned[x].toLowerCase())>-1) return false;
		}
		for(x=0;x<that.db.length;x++) { //need to add a link checker in here. If there's a URL in the message, we should send it as a link, not a note.
			if(msg.indexOf(that.db[x].keys.toLowerCase())>-1) {
				var pusher=new PushBullet(that.db[x].apikey);
				pusher.note(that.db[x].deviceName,that.options.noteTitle,message);
			}
		}
		return false;
	}
}

PushbulletTrigger.prototype._stripCommand = function(msg, command){
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return message.substring(command+1);
	}
	return false;
}
