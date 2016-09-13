var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
const Eris = require("eris");
/*
Trigger that relays between a single Discord server and steam chat. May (or may not) work properly in multiple discord chats (use options.rooms[] to relay only one steam chat to discord)

options: {
//	steamAdmins: [discordUserID,discordUserID], //There's no commands yet, but eventually admins will be able to change modes, etc, and users will be able to see who's in chat.
//	discordAdmins: [steamid64,steamid64],       //There's no commands yet, but eventually admins will be able to change modes, etc, and users will be able to see who's in chat.
	respectsMute: false,		//Should the relay respect mute? That is, should it stop relaying chat from when you mute it. Default is false.
	token: 'String',		//your discord bot's OAuth2 token. REQUIRED.
	command: '!relay',		// Command for controlling the relay (currently, only `!relay who` and `!relay help` is implemented)
	discordGame: "Steam Relay"	//what game is the chatbot playing? (you should explicitly set this to undefined to not play a game)
	relays: [{			//an array for configuring multiple relays. You can set up multiple relays with this.
		steamChat: 'SteamID64',		//the steamid64 for your groupchat.
		discordChannelID: 'ChannelID',	//the ChannelID of your Discord chat.
		discordServerID: 'ServerID'	//the ServerID for your discord chat. Only needed if your relay channel isn't in the main channel *and* you want to send extras (joins, parts, etc) from discord.
	}]
}
*/

var DiscordRelay = function() {
	DiscordRelay.super_.apply(this, arguments);
};

util.inherits(DiscordRelay, BaseTrigger);

var type = "DiscordRelay";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	if(!(options.token && options.relays && options.relays[0])) {
		chatBot.winston.error(chatBot.name+"/"+name+": I can't relay without an OAuth token, steam chat id, and discord channel id!");
		return false;
	}
	var trigger = new DiscordRelay(type, name, chatBot, options);
	trigger.respectsFilters       = true;
	trigger.respectsGlobalFilters = false;
	trigger.allowMessageTriggerAfterResponse = true;
	trigger.respectsMute = options.respectsMute || false;
	trigger.options.command = options.command || "!relay";
	trigger.options.steamAdmins = trigger.options.steamAdmins || [];
	trigger.options.discordAdmins = trigger.options.discordAdmins || [];
	trigger.options.command = trigger.options.command || "!discord";
	trigger.options.discordGame = trigger.options.hasOwnProperty('discordGame') ? trigger.options.discordGame : "Steam Relay";
	trigger.options.command = trigger.options.command || "!relay";
	trigger.relays = {steam:{},discord:{}};
	trigger.options.relays.map(function(relay) {
		relay.sendExtras = relay.sendExtras || trigger.options.sendExtras || false; //send joins/parts and such. can be overridden with sendSteamExtras or sendDiscordExtras
		relay.sendDiscordExtras = relay.hasOwnProperty('sendDiscordExtras') ? relay.sendDiscordExtras : relay.sendExtras;
		relay.sendUserUpdates = relay.hasOwnProperty('sendUserUpdates') ? relay.sendUserUpdates : relay.sendExtras; //if you only want name changes and not joins/parts (only works for changes on discord, not steam)
		relay.discordServerID = relay.discordServerID || relay.discordChannelID;

		trigger.relays.steam[relay.steamChat] = relay;
		trigger.relays.discord[relay.discordChannelID] = relay;
	});
	return trigger;
}

DiscordRelay.prototype._onLoggedOn = function() {
	var that = this;
	if(this.discord) {
		return true;
	}
	this.discord = new Eris.CommandClient(this.options.token, {
		autoreconnect:true,
		disableEveryone:true //don't allow people to use @everyone and @here from steam...
	});
	this.discord.connect();

	this.discord.on('ready', function(){
		that.discordOn = true;
		that.winston.debug(that.chatBot.name+"/"+that.name+": Connected to discord as "+that.discord.user.username);
		for(var key in that.relays.steam) {
			that._sendMessageAfterDelay(that.relays.steam[key].steamChat, "Connected to discord as "+that.discord.user.username);
		}
		if(that.options.discordGame) {
			that.discord.editStatus({game:{name:that.options.discordGame,type:0}});
		}
	});
	this.discord.on('messageCreate', function(message){
		var relay = that.relays.discord[message.channel.id];
		if(!relay || message.author.id===that.discord.user.id) { return; }

		var cmd = that._stripCommand(message.cleanContent);
		if(cmd && (cmd.params[1]==="users" || cmd.params[1]==="online" || cmd.params[1] === "who")) {
			var steamUsers = [];
			for(var user in that.chatBot.steamFriends.chatRooms[relay.steamChat]) {
				steamUsers.push(that._username(user));
			}
			that.discord.createMessage(relay.discordChannelID, "The following " + steamUsers.length + " are in steam chat: " + steamUsers.join(", "));
		} else if(message.cleanContent==="!ping") {
			that.discord.createMessage(relay.discordChannelID, "Pong!");
		}

		that._sendMessageAfterDelay(relay.steamChat, (message.member.nick||message.author.username) +
			(relay.sendDiscrims ? "#"+message.author.discriminator:"") +
			(relay.sendUserIds ? "#"+message.author.id:"")+": "+message.cleanContent);
	});
	this.discord.on('guildMemberAdd', function(guild, member) {
		for(var key in that.relays.discord) {
			var relay = that.relays.discord[key];
			if(guild.id === relay.discordServerID && relay.sendDiscordExtras) {
				that._sendMessageAfterDelay(relay.steamChat, (member.nick||member.user.username) +
					(relay.sendDiscrims ? "#"+member.user.discriminator:"") +
					(relay.sendUserIds ? "#"+member.id:"")+" has joined");
			}
		}
	});
	this.discord.on('guildMemberRemove', function(guild, member) {
		for(var key in that.relays.discord) {
			var relay = that.relays.discord[key];
			if(guild.id === relay.discordServerID && relay.sendDiscordExtras) {
				that._sendMessageAfterDelay(relay.steamChat, (member.nick||member.user.username) +
					(relay.sendDiscrims ? "#"+member.user.discriminator:"") +
					(relay.sendUserIds ? "#"+member.id:"")+" has left");
			}
		}
	});
	this.discord.on('channelUpdate', function(channel, oldChannel) {
		var relay = that.relays.discord[channel.id];
		if(relay && relay.sendDiscordExtras && channel.topic && channel.topic !== oldChannel.topic) {
			that._sendMessageAfterDelay(relay.steamChat, "The topic has been changed to:\n" + channel.topic);
		}
	});
	this.discord.on('guildMemberUpdate', function(guild, member, oldMember) {
		for(var key in that.relays.discord) {
			var relay = that.relays.discord[key];
			if(guild.id === relay.discordServerID && relay.sendDiscordExtras && member.nick !== oldMember.nick) {
				that._sendMessageAfterDelay(relay.steamChat, (oldMember.nick||member.user.username) +
					(relay.sendDiscrims ? "#"+member.user.discriminator:"") +
					(relay.sendUserIds ? "#"+member.id:"")+" has changed their nickname to " + (member.nick||member.user.username));
			}
		}
	});
/**
 *  If nobody needs this, I'd rather just not adapt it to multiple chats...
 */
/*	this.discord.on('userUpdate', function(user, oldUser) {
		if((relay.sendDiscordExtras||relay.sendUserUpdates) && user.username !== oldUser.username && (relay.sendDiscrims||relay.sendUserIds)) {
			that._sendMessageAfterDelay(relay.steamChat, oldUser.username +
				(relay.sendDiscrims ? "#"+oldUser.discriminator:"") +
				(relay.sendUserIds ? "#"+oldUser.id:"")+" has changed their username to " + user.username +
				(relay.sendDiscrims ? "#"+user.discriminator:"") +
				(relay.sendUserIds ? "#"+user.id:""));
		}
	});
*/
	return true;
}

DiscordRelay.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	if(! (roomId in this.relays.steam)) {
		return false;
	}
	var that = this;
	that.winston.silly(that.chatBot.name+"/"+that.name,message);
	var relay = this.relays.steam[roomId];
	if(that.discordOn) {
		that.discord.createMessage(relay.discordChannelID,
			"**"+that._username(chatterId)+(relay.sendUserIds ? "/"+chatterId:"")+"**: "+message);
	}
	var cmd = that._stripCommand(message);
	if(cmd && cmd.params && (cmd.params[1]==="users" || cmd.params[1]==="who" || cmd.params[1]==="online" || cmd.params[1]==="idle")) {
		var guild = this.discord.guilds.get(relay.discordServerID);
		var count=[0,0];
		var online = guild.members.filter(function(member){
			if(member.status==="online"){
				count[0]++;
				return true;
			}
		}).map(function(member){
			return (member.nick||member.user.username) +
				(relay.sendDiscrims ? "#" + member.user.discriminator : "") +
				(relay.sendUserIds ? "#" + member.id : "");
		}).join(", ");
		var idle = guild.members.filter(function(member){
			if(member.status==="idle"){
				count[1]++;
				return true;
			}
		}).map(function(member){
			return (member.nick||member.user.username) +
				(relay.sendDiscrims ? "#" + member.user.discriminator : "") +
				(relay.sendUserIds ? "#" + member.id : "");
		}).join(", ");
		var out = "There are " + guild.memberCount + " users in discord.";
		if(cmd.params[1]!=="idle") {
			out = out + "\nThe following " + count[0] + " users are currently listed as online: " + online;
		}
		if(cmd.params[1]==="users"||cmd.params[1]===idle) {
			out = out + "\nThe following " + count[1] + " users are currently listed as idle: " + idle;
		}
		that._sendMessageAfterDelay(relay.steamChat,out);
//		return true; //testing
		return false;

	}
/*	if(relay.steamAdmins.indexOf(chatterId)>-1) && cmd) {
		cmd.params.splice(0,1); //remove initial !relay command
		var subcmd = cmd.params.splice(0,1); //remove the subcommand to its own variable
		if(subcmd==="ban") {
			that.discord.ban({
				serverID:relay.discordServerID || relay.discordChannelID,
				:cmd.params[0],
			});
		} else if(subcmd==="unban") {
			that.discord.unban({
				channelID:relay.discordChannelID,
				target:cmd.params[0],
			});
		} else if(subcmd==="invite") {
			that.discord.createInvite({channel:relay.discordChannelID,temporary:false});
		} else if(subcmd==="mute") {
		} else if(subcmd==="unmute") {
		}
	}
*/
	return false;
}

DiscordRelay.prototype._sendSteamAction = function(action,userId,byId,relay) {
	byId = byId || null;
	var that = this;
	if(that.discordOn && relay.sendSteamExtras) {
		this.discord.createMessage(relay.discordChannelID,
			"**"+that._username(userId) +
				(relay.sendUserIds ? "/"+userId : "") + "** " + action +
				(byId ? " by **" + that._username(byId) + (relay.sendUserIds ? "/"+byId+"**":"") : "")
		);
	}
}

DiscordRelay.prototype._respondToEnteredMessage = function(roomId,userId) {
	var relay = this.relays.steam[roomId];
	if(relay) {
		this._sendSteamAction("joined",userId,false,relay)
	}
	return false;
}

DiscordRelay.prototype._respondToLeftMessage = function(roomId, userId) {
	var relay = this.relays.steam[roomId];
	if(relay) {
		this._sendSteamAction("left",userId,false,relay);
	}
	return false;
}

DiscordRelay.prototype._respondToKick = function(roomId,kickedId,kickerId) {
	var relay = this.relays.steam[roomId];
	if(relay) {
		this._sendSteamAction("left",kickedId,kickerId,relay);
	}
	return false;
}

DiscordRelay.prototype._respondToBan = function(roomId,bannedId,bannerId) {
	var relay = this.relays.steam[roomId];
	if(relay) {
		this._sendSteamAction("left",bannedId,bannerId,relay);
	}
	return false;
}

// Return true if the event was eaten
DiscordRelay.prototype._username = function(steamId) {
	return ((this.chatBot.steamFriends.personaStates && steamId in this.chatBot.steamFriends.personaStates) ? this.chatBot.steamFriends.personaStates[steamId].player_name : steamId)
}

DiscordRelay.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
