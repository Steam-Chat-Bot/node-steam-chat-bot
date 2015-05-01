var _ = require('underscore');
var steam = require('steam');

var ChatBot = require('../lib/chatBot.js').ChatBot;

describe("ChatBot", function() {

	var bot;
	var fakeClient;
	var fakeTriggerFactory;

	beforeEach(function() {
		fakeClient = jasmine.createSpyObj('fakeClient', ['on', 'logOn', 'setPersonaState', 'joinChat']);

		fakeTriggerFactory = jasmine.createSpyObj('fakeTriggerFactory', ['createTrigger']);
		fakeTriggerFactory.createTrigger.andCallFake(function(type, name, bot, options) {
			if (type == "invalidType") {
				return null;
			}

			var fakeTrigger = jasmine.createSpyObj('fakeTrigger', ['getOptions', 'onChatInvite', 'onFriendRequest', 'onFriendMessage', 'onChatMessage']);
			fakeTrigger.getOptions.andCallFake(function() {
				return options;
			});
			fakeTrigger.name = name;
			fakeTrigger.type = type;

			return fakeTrigger;
		});
	});

	afterEach(function() {
		if (bot) {
			clearInterval(bot.babysitInterval);
		}
	});

	describe("ChatBot connections", function() {
		it("should connect when created if autoConnect option is on", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, autoConnect: true, autoReconnect: true });
			expect(fakeClient.logOn).toHaveBeenCalled();
		});

		it("should reconnect when disconnected if autoReconnect option is on", function() {
			runs(function() {
				bot = new ChatBot("username", "password", { client: fakeClient, babysitTimer: 100, autoConnect: true, autoReconnect: true });
				expect(fakeClient.logOn.calls.length).toEqual(1);
				bot.connected = false;
			});

			waits(110);

			runs(function() {
				expect(fakeClient.logOn.calls.length).toEqual(2);
			});
		});

		it("should not automatically connect if autoConnect option is off", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, autoConnect: false, autoReconnect: false });
			expect(fakeClient.logOn).not.toHaveBeenCalled();
			bot.connect();
			expect(fakeClient.logOn).toHaveBeenCalled();
		});

		it("should not automatically re-connect until connect is called if autoConnect option is off", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, autoConnect: false, autoReconnect: true, babysitTimer: 100 });
			
			waits(110);

			runs(function() {
				expect(fakeClient.logOn).not.toHaveBeenCalled();

				bot.connect();
				expect(fakeClient.logOn).toHaveBeenCalled();
				bot.connected = false;
			});

			waits(110);

			runs(function() {
				expect(fakeClient.logOn.calls.length).toEqual(2);
			});
		});

		it("should not automatically re-connect on disconnection if autoReconnect option is off", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, autoConnect: false, autoReconnect: false, babysitTimer: 100 });
			expect(fakeClient.logOn).not.toHaveBeenCalled();
			bot.connect();
			expect(fakeClient.logOn).toHaveBeenCalled();

			bot.connected = false;

			waits(110);

			runs(function() {
				expect(fakeClient.logOn.calls.length).toEqual(1);
			});
		});
	});

	describe("ChatBot muting", function() {
		it("should update its persona state when muted and unmuted", function() {
			bot = new ChatBot("username", "password", { client: fakeClient });
			bot._onLoggedOn(); // Fake logged on event
			expect(fakeClient.setPersonaState.calls.length).toEqual(1);
			expect(fakeClient.setPersonaState.calls[0].args[0]).toEqual(bot.unmutedState);

			bot.mute();
			expect(fakeClient.setPersonaState.calls.length).toEqual(2);
			expect(fakeClient.setPersonaState.calls[1].args[0]).toEqual(bot.mutedState);

			bot.unmute();
			expect(fakeClient.setPersonaState.calls.length).toEqual(3);
			expect(fakeClient.setPersonaState.calls[2].args[0]).toEqual(bot.unmutedState);
		});

		it("should log in with the muted persona state after reconnection when muted", function() {
			runs(function() {
				bot = new ChatBot("username", "password", { client: fakeClient, babysitTimer: 100 });
				bot._onLoggedOn(); // Fake logged on event
				bot.mute();
				bot.connected = false;

				setTimeout(function() {
					bot._onLoggedOn(); // Fake logged on event
				}, 110);
			});

			waits(120);

			runs(function() {
				expect(fakeClient.setPersonaState.calls.length).toEqual(3); // first log-on, mute, reconnect
				expect(fakeClient.setPersonaState.calls[2].args[0]).toEqual(bot.mutedState);
			});
		});
	});

	describe("ChatBot trigger management", function() {
		it("should return true when a valid trigger is added", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });

			expect(bot.addTrigger("trigger1", "type")).not.toBeNull();
		});

		it("should return false when a trigger can't be created", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });

			expect(bot.addTrigger("trigger1", "invalidType")).toBeNull();
		});

		it("should replace a trigger when one is added with the same name", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });

			expect(bot.addTrigger("trigger1", "type1")).not.toBeNull();
			expect(bot.addTrigger("trigger1", "type2")).not.toBeNull();
			expect(_.size(bot.triggers)).toEqual(1);
		});

		it("should return true when a trigger is removed", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });

			expect(bot.addTrigger("trigger1", "type")).not.toBeNull();
			expect(bot.removeTrigger("trigger1")).toEqual(true);
			expect(_.size(bot.triggers)).toEqual(0);
		});

		it("should return false when remove is called for a non-existent trigger", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });

			expect(bot.removeTrigger("trigger")).toEqual(false);
		});

		it("should allow multiple triggers to be added in the same call", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });

			var triggers = [
				{ name: "trigger1", type: "type1", options: {} },
				{ name: "trigger2", type: "type1" },
				{ name: "trigger3", type: "type2", options: {} }
			];

			expect(bot.addTriggers(triggers)).toEqual(true);
			expect(_.size(bot.triggers)).toEqual(3);
		});

		it("should return false if any trigger added in bulk is invalid", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });

			var triggers = [
				{ name: "trigger1", type: "type1", options: {} },
				{ name: "trigger2", type: "type1" },
				{ name: "trigger3", type: "invalidType", options: {} }
			];

			expect(bot.addTriggers(triggers)).toEqual(false);
			expect(_.size(bot.triggers)).toEqual(2);
		});

		it("should be able to export trigger details and in the same form that they can be added", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });

			var triggers = [
				{ name: "trigger1", type: "type1", options: { option1: true, option2: "string", option3: 3 } },
				{ name: "trigger2", type: "type1" },
				{ name: "trigger3", type: "type2", options: {} }
			];

			bot.addTriggers(triggers);
			var exportedTriggers = bot.getTriggerDetails();
			expect(_.size(exportedTriggers)).toEqual(3);
			expect(_.size(bot.triggers)).toEqual(3);

			bot.clearTriggers();
			expect(_.size(bot.triggers)).toEqual(0);

			expect(bot.addTriggers(exportedTriggers)).toEqual(true);
			expect(_.size(bot.triggers)).toEqual(3);

			var exportedTriggers = {};
			expect(_.size(bot.triggers)).toEqual(3);
		});
	});

	describe("ChatBot trigger interactions", function() {
		it("should call onChatInvite on triggers when a user chat room invitation is sent", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger1 = bot.addTrigger("fakeTrigger1", "type");
			var fakeTrigger2 = bot.addTrigger("fakeTrigger2", "type");

			bot._onChatInvite("roomId", "roomName", "inviterId");

			expect(fakeTrigger1.onChatInvite).toHaveBeenCalledWith("roomId", "roomName", "inviterId");
			expect(fakeTrigger2.onChatInvite).toHaveBeenCalledWith("roomId", "roomName", "inviterId");
		});

		it("should call onFriendRequest on triggers when a friend request is sent", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger1 = bot.addTrigger("fakeTrigger1", "type");
			var fakeTrigger2 = bot.addTrigger("fakeTrigger2", "type");

			bot._onRelationship("userId", steam.EFriendRelationship.PendingInvitee);

			expect(fakeTrigger1.onFriendRequest).toHaveBeenCalledWith("userId");
			expect(fakeTrigger2.onFriendRequest).toHaveBeenCalledWith("userId");
		});

		it("should not call onFriendRequest on triggers when a other relationship events occur", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger = bot.addTrigger("fakeTrigger", "type");

			bot._onRelationship("userId", steam.EFriendRelationship.None);
			bot._onRelationship("userId", steam.EFriendRelationship.Blocked);
			bot._onRelationship("userId", steam.EFriendRelationship.RequestInitiator);
			bot._onRelationship("userId", steam.EFriendRelationship.PendingInviter);
			bot._onRelationship("userId", steam.EFriendRelationship.Friend);
			bot._onRelationship("userId", steam.EFriendRelationship.Ignored);
			bot._onRelationship("userId", steam.EFriendRelationship.IgnoredFriend);
			bot._onRelationship("userId", steam.EFriendRelationship.SuggestedFriend);

			expect(fakeTrigger.onFriendRequest).not.toHaveBeenCalled();
		});

		it("should call onFriendMessage on triggers when a friend message is received", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger = bot.addTrigger("fakeTrigger", "type");

			bot._onFriendMsg("userId", "message", steam.EChatEntryType.ChatMsg);

			expect(fakeTrigger.onFriendMessage).toHaveBeenCalledWith("userId", "message", false);
		});

		it("should not call onFriendMessage on triggers when another chat entry type is received in a friend chat", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger = bot.addTrigger("fakeTrigger", "type");

			bot._onFriendMsg("userId", "message", steam.EChatEntryType.Typing);

			expect(fakeTrigger.onFriendMessage).not.toHaveBeenCalled();
		});

		it("should pass on the fact that a message has already been sent in onFriendMessage calls", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger1 = bot.addTrigger("fakeTrigger1", "type");
			fakeTrigger1.onFriendMessage.andCallFake(function() { return false; });
			var fakeTrigger2 = bot.addTrigger("fakeTrigger2", "type");
			fakeTrigger2.onFriendMessage.andCallFake(function() { return true; });
			var fakeTrigger3 = bot.addTrigger("fakeTrigger3", "type");
			fakeTrigger3.onFriendMessage.andCallFake(function() { return false; });
			var fakeTrigger4 = bot.addTrigger("fakeTrigger4", "type");
			fakeTrigger4.onFriendMessage.andCallFake(function() { return false; });

			bot._onFriendMsg("userId", "message", steam.EChatEntryType.ChatMsg);

			expect(fakeTrigger1.onFriendMessage).toHaveBeenCalledWith("userId", "message", false);
			expect(fakeTrigger2.onFriendMessage).toHaveBeenCalledWith("userId", "message", false);
			expect(fakeTrigger3.onFriendMessage).toHaveBeenCalledWith("userId", "message", true);
			expect(fakeTrigger4.onFriendMessage).toHaveBeenCalledWith("userId", "message", true);
		});

		it("should call onChatMessage on triggers when a message is received in a chat room", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger = bot.addTrigger("fakeTrigger", "type");

			bot._onChatMsg("roomId", "message", steam.EChatEntryType.ChatMsg, "chatterId");

			expect(fakeTrigger.onChatMessage).toHaveBeenCalledWith("roomId", "chatterId", "message", false, false);
		});

		it("should not call onChatMessage on triggers when another chat entry type is received in a chat room", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger = bot.addTrigger("fakeTrigger", "type");

			bot._onChatMsg("roomId", "message", steam.EChatEntryType.InviteGame, "chatterId");

			expect(fakeTrigger.onChatMessage).not.toHaveBeenCalled();
		});

		it("should pass on the fact that a message has already been sent in onChatMessage calls", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger1 = bot.addTrigger("fakeTrigger1", "type");
			fakeTrigger1.onChatMessage.andCallFake(function() { return false; });
			var fakeTrigger2 = bot.addTrigger("fakeTrigger2", "type");
			fakeTrigger2.onChatMessage.andCallFake(function() { return true; });
			var fakeTrigger3 = bot.addTrigger("fakeTrigger3", "type");
			fakeTrigger3.onChatMessage.andCallFake(function() { return false; });
			var fakeTrigger4 = bot.addTrigger("fakeTrigger4", "type");
			fakeTrigger4.onChatMessage.andCallFake(function() { return false; });

			bot._onChatMsg("roomId", "message", steam.EChatEntryType.ChatMsg, "chatterId");

			expect(fakeTrigger1.onChatMessage).toHaveBeenCalledWith("roomId", "chatterId", "message", false, false);
			expect(fakeTrigger2.onChatMessage).toHaveBeenCalledWith("roomId", "chatterId", "message", false, false);
			expect(fakeTrigger3.onChatMessage).toHaveBeenCalledWith("roomId", "chatterId", "message", true, false);
			expect(fakeTrigger4.onChatMessage).toHaveBeenCalledWith("roomId", "chatterId", "message", true, false);
		});

		it("should pass on the fact that the bot is muted in onChatMessage calls", function() {
			bot = new ChatBot("username", "password", { client: fakeClient, triggerFactory: fakeTriggerFactory });
			var fakeTrigger = bot.addTrigger("fakeTrigger", "type");

			bot.mute();
			bot._onChatMsg("roomId", "message", steam.EChatEntryType.ChatMsg, "chatterId");

			expect(fakeTrigger.onChatMessage).toHaveBeenCalledWith("roomId", "chatterId", "message", false, true);
		});
	});
});
