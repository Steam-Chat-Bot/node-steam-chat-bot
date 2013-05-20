var sinon = require('sinon');

var BaseTrigger = require('../lib/triggers/baseTrigger.js');

describe("BaseTrigger", function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it("should respect the probability option during a random roll", function() {
		var trigger = BaseTrigger.create("base", fakeBot, { probability: 0.8 } );

		sinon.stub(Math, 'random').returns(0);
		expect(trigger._randomRoll()).toEqual(true);
		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.5);
		expect(trigger._randomRoll()).toEqual(true);
		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.79);
		expect(trigger._randomRoll()).toEqual(true);
		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.81);
		expect(trigger._randomRoll()).toEqual(false);
		Math.random.restore();

		sinon.stub(Math, 'random').returns(1);
		expect(trigger._randomRoll()).toEqual(false);
		Math.random.restore();
	});

	it("random roll should succeed always with probability set to 1", function() {
		var trigger = BaseTrigger.create("base", fakeBot, { probability: 1 } );

		sinon.stub(Math, 'random').returns(0);
		expect(trigger._randomRoll()).toEqual(true);
		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.5);
		expect(trigger._randomRoll()).toEqual(true);
		Math.random.restore();

		sinon.stub(Math, 'random').returns(1);
		expect(trigger._randomRoll()).toEqual(true);
		Math.random.restore();
	});

	it("random roll should succeed always with no probability option", function() {
		var trigger = BaseTrigger.create("base", fakeBot, { } );

		sinon.stub(Math, 'random').returns(0);
		expect(trigger._randomRoll()).toEqual(true);
		Math.random.restore();

		sinon.stub(Math, 'random').returns(0.5);
		expect(trigger._randomRoll()).toEqual(true);
		Math.random.restore();

		sinon.stub(Math, 'random').returns(1);
		expect(trigger._randomRoll()).toEqual(true);
		Math.random.restore();
	});

	it("should respect the delay option when sending a message", function() {
		runs(function() {
			var trigger = BaseTrigger.create("base", fakeBot, { delay: 100 } );
			delayLapsed = false;
			trigger._sendMessageAfterDelay("steamId", "message");

			setTimeout(function() { delayLapsed = true; }, 110);
			setTimeout(function() { expect(fakeBot.sendMessage).not.toHaveBeenCalled(); }, 50);
		});

		waitsFor(function() { return delayLapsed; }, "Delay should have lapsed", 120);

		runs(function() {
			expect(fakeBot.sendMessage).toHaveBeenCalled();
		});
	});

	it("should not delay sending a message when there is no delay option", function() {
		runs(function() {
			var trigger = BaseTrigger.create("base", fakeBot, { } );
			delayLapsed = false;
			trigger._sendMessageAfterDelay("steamId", "message");

			setTimeout(function() { delayLapsed = true; }, 5);
		});

		waitsFor(function() { return delayLapsed; }, "Delay should have lapsed", 10);

		runs(function() {
			expect(fakeBot.sendMessage).toHaveBeenCalled();
		});
	});

	it("should not delay sending a message when the delay option is 0", function() {
		runs(function() {
			var trigger = BaseTrigger.create("base", fakeBot, { delay: 0 } );
			delayLapsed = false;
			trigger._sendMessageAfterDelay("steamId", "message");

			setTimeout(function() { delayLapsed = true; }, 5);
		});

		waitsFor(function() { return delayLapsed; }, "Delay should have lapsed", 10);

		runs(function() {
			expect(fakeBot.sendMessage).toHaveBeenCalled();
		});
	});

	it("should respect the timeout option when about to fire", function() {
		var trigger;
		runs(function() {
			trigger = BaseTrigger.create("base", fakeBot, { timeout: 50 } );
			timeoutLapsed = false;
			expect(trigger.replyEnabled).toEqual(true);
			trigger._disableForTimeout();
			expect(trigger.replyEnabled).toEqual(false);

			setTimeout(function() { timeoutLapsed = true; }, 60);
		});

		waitsFor(function() { return timeoutLapsed; }, "Delay should have lapsed", 70);

		runs(function() {
			expect(trigger.replyEnabled).toEqual(true);
		});
	});

	it("should not disable messages when there is no timeout option", function() {
		var trigger = BaseTrigger.create("base", fakeBot, { });
		expect(trigger.replyEnabled).toEqual(true);
		trigger._disableForTimeout();
		expect(trigger.replyEnabled).toEqual(true);
	});
});
