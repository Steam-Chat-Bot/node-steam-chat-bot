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
	steamChat: 'SteamID64',		//the steamid64 for your groupchat.
	discordChannelID: 'ChannelID',	//the ChannelID of your Discord chat.
	discordGame: "Steam Relay"	//what game is the chatbot playing? (you should explicitly set this to undefined to not play a game)
	discordServerID: 'ServerID'	//the ServerID for your discord chat. Only needed if your relay channel isn't in the main channel *and* you want to send extras (joins, parts, etc) from discord.
	sendDiscordExtras: false,	//send joins and leaves and name changes from discord?
	prefix: "!",			//used for commands discord-side. Not yet implemented.
}
*/

var DiscordRelay = function() {
	DiscordRelay.super_.apply(this, arguments);
};

util.inherits(DiscordRelay, BaseTrigger);

var type = "DiscordRelay";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	if(!(options.token && (options.steamChat || options.rooms) && options.discordChannelID)) {
		chatBot.winston.error(chatBot.name+"/"+name+": I can't relay without an OAuth token, steam chat id, and discord channel id!");
		return false;
	}
	var trigger = new DiscordRelay(type, name, chatBot, options);
	trigger.respectsFilters       = false;
	trigger.respectsGlobalFilters = false;
	trigger.allowMessageTriggerAfterResponse = true;
	trigger.respectsMute = options.respectsMute || false;
	trigger.options.command = options.command || "!relay";
	trigger.options.steamAdmins = trigger.options.steamAdmins || [];
	trigger.options.discordAdmins = trigger.options.discordAdmins || [];
	trigger.options.command = trigger.options.command || "!discord";
	trigger.options.steamChat = trigger.options.steamChat || trigger.options.rooms[1];
	trigger.options.discordGame = trigger.options.hasOwnProperty('discordGame') ? trigger.options.discordGame : "Steam Relay";
	trigger.options.sendUserIds = trigger.options.sendUserIds || false;
	trigger.options.sendDiscrims = trigger.options.sendDiscrims || false;
	trigger.options.description = trigger.options.description || "A steam relay bot";
	trigger.options.owner = trigger.options.owner || undefined;
	trigger.options.prefix = trigger.options.prefix || "!";
	trigger.options.discordServerID = trigger.options.discordServerID || trigger.options.discordChannelID;
	trigger.options.sendDiscordExtras = trigger.options.sendDiscordExtras || false; //send joins and leaves and such from discord (in case you have several channels)
	return trigger;
}

DiscordRelay.prototype._onLoggedOn = function() {
	var that = this;
	if(this.discord) {
		return true;
	}
	this.discord = new Eris.CommandClient(this.options.token, {
		autoreconnect:true,
		disableEveryone:true, //don't allow people to use @everyone and @here from steam...
		owner:that.options.owner,
		prefix:that.options.prefix
	});
	this.discord.connect();

	this.discord.on('ready', function(){
		that.discordOn = true;
		that.winston.debug(that.chatBot.name+"/"+that.name+": Connected to discord as "+that.discord.id);
		that._sendMessageAfterDelay(that.options.steamChat, "Connected to discord as "+that.discord.user.username);
		if(that.options.discordGame) {
			that.discord.editStatus({game:{name:that.options.discordGame,type:0}});
		}
	});
	this.discord.on('messageCreate', function(message){
		if(message.channel.id !== that.options.discordChannelID || message.author.id===that.discord.user.id) { return;}

		if(message.cleanContent==="!users" || message.cleanContent==="!online" || message.cleanContent==="!who") {
			var steamUsers = [];
			for(var user in that.chatBot.steamFriends.chatRooms[that.options.steamChat]) {
				steamUsers.push(that._username(user));
			}
			that.discord.createMessage(that.options.discordChannelID, "The following " + steamUsers.length + " are in steam chat: " + steamUsers.join(", "));
		} else if(message.cleanContent==="!ping") {
			that.discord.createMessage(that.options.discordChannelID, "Pong!");
		}

		that._sendMessageAfterDelay(that.options.steamChat, (message.member.nick||message.author.username) +
			(that.options.sendDiscrims ? "#"+message.author.discriminator:"") +
			(that.options.sendUserIds ? "#"+message.author.id:"")+": "+message.cleanContent);
	});
	this.discord.on('guildMemberAdd', function(guild, member) {
		if(guild.id === that.options.discordServerID && that.options.sendDiscordExtras) {
			that._sendMessageAfterDelay(that.options.steamChat, (member.nick||member.user.username) +
				(that.options.sendDiscrims ? "#"+member.user.discriminator:"") +
				(that.options.sendUserIds ? "#"+member.id:"")+" has joined");
		}
	});
	this.discord.on('guildMemberRemove', function(guild, member) {
		if(guild.id === that.options.discordServerID && that.options.sendDiscordExtras) {
			that._sendMessageAfterDelay(that.options.steamChat, (member.nick||member.user.username) +
				(that.options.sendDiscrims ? "#"+member.user.discriminator:"") +
				(that.options.sendUserIds ? "#"+member.id:"")+" has left");
		}
	});
	this.discord.on('channelUpdate', function(channel, oldChannel) {
		if(channel.id === that.options.discordChannelID && that.options.sendDiscordExtras && channel.topic && channel.topic !== oldChannel.topic) {
			that._sendMessageAfterDelay(that.options.steamChat, "The topic has been changed to:\n" + channel.topic);
		}
	});
	this.discord.on('guildMemberUpdate', function(guild, member, oldMember) {
		if(guild.id === that.options.discordServerID && that.options.sendDiscordExtras && member.nick !== oldMember.nick) {
			that._sendMessageAfterDelay(that.options.steamChat, (oldMember.nick||member.user.username) +
				(that.options.sendDiscrims ? "#"+member.user.discriminator:"") +
				(that.options.sendUserIds ? "#"+member.id:"")+" has changed their nickname to " + (member.nick||member.user.username));
		}
	});
	this.discord.on('userUpdate', function(user, oldUser) {
		if(that.options.sendDiscordExtras && user.username !== oldUser.username && (that.options.sendDiscrims||that.options.sendUserIds)) {
			that._sendMessageAfterDelay(that.options.steamChat, oldUser.username +
				(that.options.sendDiscrims ? "#"+oldUser.discriminator:"") +
				(that.options.sendUserIds ? "#"+oldUser.id:"")+" has changed their username to " + user.username +
				(that.options.sendDiscrims ? "#"+user.discriminator:"") +
				(that.options.sendUserIds ? "#"+user.id:""));
		}
	});
/*	this.discord.registerCommand('users', function(message, args) {
		console.log({channelid:message.channel.id,setChannel:that.options.discordChannelID,me:that.discord.user.id,author:message.author.id});
		if(message.channel.id !== that.options.discordChannelID || message.author.id===that.discord.user.id) { return null;}
		var steamUsers = [];
		for(var user in that.chatBot.steamFriends.chatRooms[that.options.steamChat]) {
			steamUsers.push(that._username(user));
		}
		return "The following " + steamUsers.length + " are in steam chat: " + steamUsers.join(", ");
	}, {
		description: "Get the list of users from steam",
		fullDescription: "List all the users in the relayed steam chat",
		caseInsensitive: true
	})
	this.discord.registerCommand("ping", "Pong!", { // Make a ping command
		description: "Pong!",
		fullDescription: "This command could be used to check if the bot is up. Or entertainment when you're bored."
	});
*/
	return true;
}

DiscordRelay.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	var that = this;
	that.winston.silly(that.chatBot.name+"/"+that.name,message);
	if(that.discordOn) {
		that.discord.createMessage(that.options.discordChannelID,
			"**"+that._username(chatterId)+(that.options.sendUserIds ? "/"+chatterId:"")+"**: "+message);
	}
	var cmd = that._stripCommand(message);
	if(cmd && cmd.params && (cmd.params[1]==="users" || cmd.params[1]==="who" || cmd.params[1]==="online" || cmd.params[1]==="idle")) {
		var guild = this.discord.guilds.get(that.options.discordServerID);
		var count=[0,0];
		var online = guild.members.filter(function(member){
			if(member.status==="online"){
				count[0]++;
				return true;
			}
		}).map(function(member){
			return (member.nick||member.user.username) +
				(that.options.sendDiscrims ? "#" + member.user.discriminator : "") +
				(that.options.sendUserIds ? "#" + member.id : "");
		}).join(", ");
		var idle = guild.members.filter(function(member){
			if(member.status==="idle"){
				count[1]++;
				return true;
			}
		}).map(function(member){
			return (member.nick||member.user.username) +
				(that.options.sendDiscrims ? "#" + member.user.discriminator : "") +
				(that.options.sendUserIds ? "#" + member.id : "");
		}).join(", ");
		var out = "There are " + guild.memberCount + " users in discord.";
		if(cmd.params[1]!=="idle") {
			out = out + "\nThe following " + count[0] + " users are currently listed as online: " + online;
		}
		if(cmd.params[1]==="users"||cmd.params[1]===idle) {
			out = out + "\nThe following " + count[1] + " users are currently listed as idle: " + idle;
		}
		that._sendMessageAfterDelay(that.options.steamChat,out);
		return true;
	}
/*	if(that.options.steamAdmins.indexOf(chatterId)>-1) && cmd) {
		cmd.params.splice(0,1); //remove initial !relay command
		var subcmd = cmd.params.splice(0,1); //remove the subcommand to its own variable
		if(subcmd==="ban") {
			that.discord.ban({
				serverID:that.options.discordServerID || that.options.discordChannelID,
				:cmd.params[0],
			});
		} else if(subcmd==="unban") {
			that.discord.unban({
				channelID:that.options.discordChannelID,
				target:cmd.params[0],
			});
		} else if(subcmd==="invite") {
			that.discord.createInvite({channel:that.options.discordChannelID,temporary:false});
		} else if(subcmd==="mute") {
		} else if(subcmd==="unmute") {
		}
	}
*/
	return false;
}

DiscordRelay.prototype._sendSteamAction = function(action,userId,byId) {
	byId = byId || null;
	var that = this;
	if(that.discordOn) {
		that.discord.createMessage(that.options.discordChannelID,
			"**"+that._username(userId) +
				(that.options.sendUserIds ? "/"+userId : "") + "** " + action +
				(byId ? " by **" + that._username(byId) + (that.options.sendUserIds ? "/"+byId+"**":"") : "")
		);
	}
}

DiscordRelay.prototype._respondToEnteredMessage = function(roomId,userId) {
	this._sendSteamAction("joined",userId)
	return false;
}

DiscordRelay.prototype._respondToLeftMessage = function(roomId, userId) {
	this._sendSteamAction("left",userId);
	return false;
}

DiscordRelay.prototype._respondToKick = function(roomId,kickedId,kickerId) {
	this._sendSteamAction("left",kickedId,kickerId);
	return false;
}

DiscordRelay.prototype._respondToBan = function(roomId,bannedId,bannerId) {
	this._sendSteamAction("left",bannedId,bannerId);
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
