var util = require("util");
var PushBullet = require("pushbullet");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var fs = require('fs');
var _ =require("lodash");
var nodemailer = require('nodemailer');
var moment = require('moment');
var pushover = require('pushover-notifications');
var fnd = require('filendir');
/*
A notification trigger. Notify anyone who wants of anything they want. Basically, if a keyword is in a message, it gets sent to their email/pm/pusbbullet.
cmd - base command. Defaults to !notify. Everything else is a subcommand (parameter) except seenCommand.
seenCommand = string - what is the command for the seen function? !seen steamID64.
dbFile - database file. This is a flatfile containing json. Defaults to BOTNAME/Notifications.db.
roomNames - object associating group names with ids, for use displaying group name
nodemailer = object - initialized nodemailer, overrides other mail options, allows usage of other transports (only smtp and direct are built-in). If not used, tries for sendmail (below option)
sendmailPath = string - path to sendmail binary. I recommend using ssmtp to use an smtp server. If not included, uses smtpPool (below option)
smtpPoolOptions - object of options for nodemailer's smtpPool transport. If not included, will try to send mails using direct-transport. Most likely such mails will not be received.
hostname = string - hostname that will be used to introduce direct transport mailer to the mx server.
address = string - email address that messages will appear to come from.
hashfunc = function - function used to hash email address for verification. function(address) { return hash; }. Defaults to sha1 from crypto.
saveTimer = int - frequently to write the database to disk (for the seen command). Set to -1 to disable. Defaults to 5min.
sendmailArgs - array of arguments to pass to the sendmail path. Use if you want eg a custom config for ssmtp. ['-uusername','-ppassword']
pushoverapikey = string - you need to get this from pushover (PushBullet has api limitation, pushover apparently does not, so use your own key)
*/

var NotificationTrigger = function() {
	NotificationTrigger.super_.apply(this, arguments);
};

util.inherits(NotificationTrigger, BaseTrigger);

var type = "NotificationTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new NotificationTrigger(type, name, chatBot, options);
	//trigger.options.admins = trigger.options.admins || []; //not implemented yet.
	trigger.allowMessageTriggerAfterResponse = true;
	trigger.options.cmd = trigger.options.hasOwnProperty("cmd") ? trigger.options.cmd : "!notify";
	trigger.options.dbFile = trigger.options.hasOwnProperty('dbFile') ? trigger.options.dbFile : chatBot.name + '/' + "Notifications.db";
	trigger.options.noteTitle=trigger.options.hasOwnProperty("noteTitle") ? trigger.options.noteTitle : "Steam message from $username in $group!";
	trigger.options.smtpPoolOptions = trigger.options.smtpPoolOptions;
	trigger.options.sendmailArgs = trigger.options.sendmailArgs || undefined;
	trigger.options.seenCommand = '!seen';
	trigger.options.saveTimer = trigger.options.saveTimer || 5*60*6000;
	trigger.options.debug = trigger.options.debug || false;
	trigger.db = (function(){try{return JSON.parse(fs.readFileSync(trigger.options.dbFile));}catch(err){return {}}})();
	trigger.respectsGlobalFilters = false;
	return trigger;
};

NotificationTrigger.prototype._onLoad = function() {
	var that = this;
	if(this.options.nodemailer) {
		that.winston.debug(that.chatBot.name+"/"+that.name+": Using passed-in nodemailer");
		this.nodemailer = this.options.nodemailer;
	} else if(this.options.address) {
		try {
			that.winston.debug(that.chatBot.name+"/"+that.name+": Attempting to create nodemailer transport");
			if(that.options.sendmailPath) {
				var sendmailTransport = require('nodemailer-sendmail-transport');
				that.nodemailer = nodemailer.createTransport(sendmailTransport({path:that.options.sendmailPath,args:that.options.sendmailArgs||undefined}));
			} else if(that.options.smtpPoolOptions) {
				var smtpPool = require('nodemailer-smtp-pool');
				that.nodemailer = nodemailer.createTransport(smtpPool(that.options.smtpPoolOptions));
			} else {
				var directTransport = require('nodemailer-direct-transport');
				that.nodemailer = nodemailer.createTransport(directTransport({name:that.options.hostname||"steam-chat-bot",debug:that.options.debug}));
			}
			if(that.options.debug){ nodemailer.on('log', function(item){ that.winston.debug(that.chatBot.name+"/"+that.name,item); }); }
		} catch(err) {
			that.winston.error(that.chatBot.name+"/"+that.name+": Failed to create nodemailer transport",err.stack);
		}
	}
	this.hashfunc = this.options.hashfunc || function(address) {
		var crypto = require('crypto');
		var shasum = crypto.createHash('sha256');
		shasum.update(that.name+address); //don't let users guess the verification code.
		return shasum.digest('base64').substring(5,15).toLowerCase(); //keep it short (sha256 is too long). Lowercase - issue with command parser, lazy fix doesn't really matter here.
	}

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

NotificationTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
NotificationTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

NotificationTrigger.prototype._respond = function(toId,userId,message) {
	var that = this;
	if(!this.db[userId]) { //initialize user database, it's easier this way so we don't have to do it on each individual function that needs it
		that.db[userId] = {
			userId: userId,
			name: that._username(userId),
			keys: []
		};
	}
	if(userId !== toId) { this.db[userId].seen = new Date().getTime(); } //Also, since we have objects for everyone we can add a !seen function. Woohoo!
	if(this._stripCommand(message,this.options.seenCommand)) {
		var who = this._stripCommand(message, this.options.seenCommand);
		if(this.db[who] && this.db[who].seen) {
			this._sendMessageAfterDelay(toId,'I last saw '+this._username(who)+" "+moment(this.db[who].seen).fromNow());
		} else {
			this._sendMessageAfterDelay(toId,"I have never seen that person say anything in a groupchat.");
		}
	} else if(this.options.cmd && message.toLowerCase().indexOf(this.options.cmd)===0) {
		var line = this._stripCommand(message, this.options.cmd);
		if(line === "delete yes") {
			that.db[userId] = { userId:userId, name:that._username(userId), keys:[] };
			that._sendMessageAfterDelay(userId,"Your settings have been deleted");
		} else if(line === "delete") {
			that._sendMessageAfterDelay(userId,"Are you sure you want to delete your settings? If so, please add 'yes' to the end of this command.");
		} else if(line === "pbdevices" && that.db[userId] && that.db[userId].pbApiKey) {
			var pusher = new PushBullet(that.db[userId].pbApiKey);
			pusher.devices(function(error, response){
				that.winston.silly(that.chatBot.name+"/"+that.name+": "+response.toString());
				if (error) {
					that.winston.error(that.chatBot.name+"/"+that.name+": ",error);
					that._sendMessageAfterDelay(userId,"An error has occurred! It has been logged.");
				} else if (response.devices.length===0) {
					that._sendMessageAfterDelay(userId,"You have no devices!");
				} else {
					var rsp = response.devices.length +" devices:";
					for(x=0;x<response.devices.length;x++) {
						rsp+="\nNickname: \""+response.devices[x].nickname+"\"";
						rsp+="  -  Iden: "+response.devices[x].iden;
						rsp+="  -  Model: "+response.model;
					}
					that._sendMessageAfterDelay(userId,rsp);
				}
			});
		} else if(line === "pbdevice" && that.db[userId] && that.db[userId].pbApiKey && that.db[userId].pbdevice) {
			delete that.db[userId].pbdevice;
		} else if (that._stripCommand(line, "pbdevice") && that.db[userId] && that.db[userId].pbApiKey) {
			var iden = that._stripCommand(line, "pbdevice");
			var pusher = new PushBullet(that.db[userId].pbApiKey);
			pusher.devices(function(error, response){
				that.winston.silly(that.chatBot.name+"/"+that.name+": "+response.toString());
				if(error) {
					that.winston.error(that.chatBot.name+"/"+that.name+": ",error);
					that._sendMessageAfterDelay(userId,"An error has occurred! It has been logged.");
				} else {
					for(var x=0;x<response.devices.length;x++) {
						var found = false;
						if(devices[x].iden===iden) {
							that.db[userId].pbdevice = iden;
							that._sendMessageAfterDelay(userId,"From now on, pushes will only be received by "+(devices[x].nickname ? devices[x].nickname : "that device"));
							found=true;
							var pusher=new PushBullet(apikey);
							that.winston.debug(that.chatBot.name+"/"+that.name+": sending pushbullet device confirmation for "+that._username(userId)+"/"+userId);
							pusher.note(that.db[userId].pbdevice,"Registered!","You will only receive steam bot notifications on devices on this device now!");
						}
						if(!true) {
							that._sendMessageAfterDelay(userId,"No such device, sorry");
						}
					}
				}
			});
		} else if (that._stripCommand(line, "pbapikey")) {
			var apikey = that._stripCommand(line, "pbapikey");
			var pusher = new PushBullet(apikey);
			pusher.me(function(err,response){
				if(err) {
					that.winston.error(that.chatBot.name+"/"+that.name+": ",err);
					that._sendMessageAfterDelay(userId,"An error has occurred! It has been logged. Most likely you have entered a bad API key.");
				} else {
					that.db[userId].pbApiKey=apikey;
					if(!response.name) {
						that._sendMessageAfterDelay(userId,"That API key is valid! It has been saved. I am sending you a push.");
					} else {
						that._sendMessageAfterDelay(userId,"Welcome, "+response.name+". Your API key has been saved. I am sending you a push.");
					}
					var pusher=new PushBullet(apikey);
					that.winston.debug(that.chatBot.name+"/"+that.name+": sending pushbullet confirmation for "+that._username(userId)+"/"+userId);
					pusher.note(that.db[userId].pbdevice,"Registered!","This pushbullet account has been registered by a steam bot. You will get notifications on all devices on this account!");
				}
			});
		} else if (that._stripCommand(line, 'pushoveruser') && that.options.pushoverapikey) {
			var pouser = that._stripCommand(line, 'pushoveruser');
			var onerror = function(error) {
				that._sendMessageAfterDelay(userId,"An error has been logged");
				that.winston.error(that.chatBot.name+"/"+that.name+": ",error);
			}
			var pusher = new pushover({user:pouser,token:that.options.pushoverapikey,onerror:onerror});
			var msg = {
				message: "This pushbullet account has been registered by a steam bot. You will get notifications on all devices on this account!\n If you are the admin of this bot, please visit the url attached and submit an issue with your debug log.",
				title: "Steam Bot Registration",
				url: "https://github.com/steam-chat-bot/node-steam-chat-bot/issues/new",
				url_title: "Submit issue to developer"
			}
			that.winston.debug(that.chatBot.name+"/"+that.name+": sending pushover confirmation for "+that._username(userId)+"/"+userId);
			pusher.send(msg,function(err, result) {
				if(err) {
					onerror(err);
				} else {
					that.winston.error(that.chatBot.name+"/"+that.name+": Please create an issue with the following information so I can complete this feature. This is the results of what happens when pushbullet sends a push");
					that.winston.error(result);
					that._sendMessageAfterDelay(userId,"I think we succeeded! Check your pushbullet devices to make sure. The developer does not have a pushbullet account. If you are the admin, please contact them with the relevant section of the debug logs to complete this feature. (It has been marked as an error to ensure it shows up)");
					that.db[userId].pouser = pouser;
				}
			});
		} else if (that._stripCommand(line, "emailconfirm") && this.nodemailer && that.db[userId]) {
			var email = that._stripCommand(line, "emailconfirm").toLowerCase();;
			that.winston.silly(that.chatBot.name+"/"+that.name+': input: '+email);
			that.winston.silly(that.chatBot.name+"/"+that.name+': propo: '+that.hashfunc(that.db[userId].emailProposed));
			if(email===that.hashfunc(that.db[userId].emailProposed)){
				that.db[userId].email = that.db[userId].emailProposed;
				delete that.db[userId].emailProposed;
				that.nodemailer.sendMail({
					from: that.options.address,
					to: that.db[userId].email,
					subject: "Steam Nofification Address Confirmation",
					text: "This email confirms your setup of "+that.db[userId].email+" as the email address for notifications setup by "+that._username(userId)+"\r\n\r\n\r\nPlease do not reply to thie email"
				});
				that._sendMessageAfterDelay(userId,"Email address confirmed. A confirmation email has been sent as well.");
			} else {
				that._sendMessageAfterDelay(userId,"Incorrect verification code or you did not set an email address. Please try again.");
			}
		} else if (that._stripCommand(line, "email") && this.nodemailer) {
			var email = that._stripCommand(line, "email").toLowerCase();
			if(email==="no" || email==="n" || email==="f" || email==="false") {
				that.winston.debug(that.chatBot.name+"/"+that.name+": Disabling emails for "+that._username(userId)+"/"+userId);
				delete that.db[userId].email;
				that._sendMessageAfterDelay(userId,"Emails disabled. Your email address has been removed from the system");
			} else {
				that.db[userId].emailProposed = email;
				that._sendMessageAfterDelay(userId,"I am sending you a verification email. You need to pm me the command I send you before I enable email notifications!");
				that.winston.info(that.chatBot.name+"/"+that.name+": Sending an email verification request for "+that._username(userId));
				that.winston.debug(that.chatBot.name+"/"+that.name+": Sending a verification request to "+email); //don't put email addresses in log unless we're debugging.
				that.nodemailer.sendMail({
					from: that.options.address,
					to: email,
					subject: "Steam Nofification Address Verification",
					text: "Please send me the following command to validate "+that.db[userId].email+" as the notification email for "+that._username(userId)+"/"+userId+"\r\n\r\n"+that.options.cmd+" emailconfirm "+that.hashfunc(email)+"\r\n\r\n\r\nPlease do not reply to thie email"
				},function(err,info){
					if(err) {
						that.winston.error(that.chatBot.name+"/"+that.name+": Error sending email:",err);
						that._sendMessageAfterDelay(userId,"I logged an error in sending you the confirmation email. You can try sending again later, or to a different email address. If it still does not work, please file a bug report.");
					} else {
						that._sendMessageAfterDelay(userId,"Email has been sent. Please enter the command in the verification email in a private message.");
					}
					that.winston.silly(that.chatBot.name+"/"+that.name+": ",info);
				});
			}
		} else if (that._stripCommand(line, "message")) {
			var sendpm = that._stripCommand(line, "message").toLowerCase();
			if(sendpm==="yes" || sendpm==="y" || sendpm==="t" || sendpm==="true") {
				that.winston.silly(that.chatBot.name+"/"+that.name+": PM enabled for "+that._username(userId)+"/"+userId+"'s notifications");
				that.db[userId].sendpm=true;
				that._sendMessageAfterDelay(userId,"I will now PM you when any of your notifications gets triggered.");
			} else if(sendpm==="no" || sendpm==="n" || sendpm==="f" || sendpm==="false") {
				that.winston.silly(that.chatBot.name+"/"+that.name+": PM disabled for "+that._username(userId)+"/"+userId+"'s notifications");
				that.db[userId].sendpm=false;
				that._sendMessageAfterDelay(userId,"I will not PM you when any of your notifications gets triggered.");
			} else {
				that._sendMessageAfterDelay(userId,"Invalid setting. Choose from True/T/False/F/Yes/Y/No/N.");
			}
		} else if (this._stripCommand(line, "filter") && that.db[userId]) {
			if(!that.db[userId].keys) {
				that.db[userId].keys=[];
			}
			//when a message contains a filtered word, we send it to their device(s).
			if (line==="filter list") {
				//list current filters
				that._sendMessageAfterDelay(userId,"\""+that.db[userId].keys.join("\",\"")+"\"");
			} else if (this._stripCommand(line, "filter add")) {
				//add a filter
				that.db[userId].keys.push(this._stripCommand(line, "filter add").toLowerCase());
			} else if (this._stripCommand(line, "filter remove")) {
				//remove a filter
				that.db[userId].keys.pop(that.db[userId].keys.indexOf(this._stripCommand(line, "filter remove")));
			} else {
				that._sendMessageAfterDelay(userId,"Valid filter commands are 'list', 'add', and 'remove'.");
			}
		} else if (this._stripCommand(line, "send") && that.db[userId]) {
			that.winston.debug(that.chatBot.name+"/"+that.name+": Testing filters for "+that._username(userId)+"/"+userId);
			that._respond('TEST NOTIFICATION FILTER','TEST USER','NotifyTest:'+message); //just call _respond on the same line
		} else {
			that._sendMessageAfterDelay(userId,"Either you're sending an invalid command, or I don't have an API key for you!\nPlease see https://steam-chat-bot.github.io/node-steam-chat-bot/TRIGGERS#notificationtrigger for help.");
		}
		if(!fnd.ws(this.options.dbFile,JSON.stringify(this.db))){ //this should be changed to a database soon.
			that.winston.error(that.chatBot.name+"/"+that.name+": Could not write database");
		} else {
			that.winston.debug(that.chatBot.name+"/"+that.name+": Database written to disk");
		}
		return true;
	} else {
		var msg = message.toLowerCase();
		// now we get to parse all configured filters. WHEE!
		_.each(that.db, function(user) { //need to add a link checker in here. If there's a URL in the message, we should send it as a link, not a note.
			if(!user.keys) {
				return false;
			}
			for(var x=0;x<user.keys.length;x++) {
				if(msg.indexOf(user.keys[x])>=0) {
					var title = that.options.noteTitle.split('$username').join(that._username(userId)+"/"+userId);
					title = title.split('$group').join(that.options.roomNames && toId in that.options.roomNames ? that.options.roomNames[toId] : toId);
					if(user.pbApiKey) {
						that.winston.debug(that.chatBot.name+"/"+that.name+": sending pushbullet for "+that._username(user.userId)+"/"+user.userId);
						var pusher=new PushBullet(user.pbApiKey);
						pusher.note(user.pbdevice || null,title,message);
					}
					var emailfail = false;
					if(user.email) {
						that.winston.debug(that.chatBot.name+"/"+that.name+": sending email for "+that._username(user.userId)+"/"+user.userId);
						that.nodemailer.sendMail({
							from: that.options.address,
							to: user.email,
							subject: title,
							text: message+"\r\n\r\n\r\nPlease do not reply to thie email"
						}, function(err,info){
							if(err) {that.winston.error(that.chatBot.name+"/"+that.name+": Error sending notification email for "+that._username(user.userId)+"/"+user.userId+": "+err);}
							if(info) {that.winston.silly(info); }
							if(user.userId) {that._sendMessageAfterDelay(user.userId,"Error sending notification for the message below. If this occurs frequently, please notify my owner.");}
							emailfail = true; //if we couldn't email, at least send a pm.
						});
					}
					if(!user.sendpm===false || emailfail===true) {
						that.winston.debug(that.chatBot.name+"/"+that.name+": sending pm for "+that._username(user.userId)+"/"+user.userId);
						if(user.userId) that._sendMessageAfterDelay(user.userId,title+"\n"+message);
					}
					if(user.pouser && that.options.pushoverapikey) {
						var pusher = new pushover({user:user.pouser,token:that.options.pushoverapikey,onerror:onerror});
						that.winston.debug(that.chatBot.name+"/"+that.name+": sending pushover for "+that._username(user.userId)+"/"+user.userId);
						pusher.send({
							message: message,
							title: title
						}, function(err, result) {
							if(err) {
								that.winston.error(that.chatBot.name+"/"+that.name+": ",err);
								if(user.userId) {that._sendMessageAfterDelay(user.userId,"Error sending pushover notification for the message below. If this occurs frequently, please notify my owner.\n"+title+"\n"+message);}
							}
							if(result) {
								that.winston.silly(that.chatBot.name+"/"+that.name+": ",result);
							}
						});
					}
				}
			}
		});
		return false;
	}
}

NotificationTrigger.prototype._stripCommand = function(message, command){
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return message.substring(command.length+1);
	}
	return false;
}

NotificationTrigger.prototype._username = function(steamId) {
	if(this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates) {
		return this.chatBot.steamFriends.personaStates[steamId].player_name;
	}
	return steamId;
}
