const BaseTrigger = require('./baseTrigger.js').BaseTrigger;
const Request = require('request');
const Coinbase = require('coinbase');

const fs = require('fs');
const util = require('util');

var BitcoinTrigger = function() {
	BitcoinTrigger.super_.apply(this, arguments);
}

util.inherits(BitcoinTrigger, BaseTrigger);

const type = 'BitcoinTrigger';
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new BitcoinTrigger(type, name, chatBot, options);
	trigger.options.dbFile = trigger.options.dbFile || chatBot.name + '/Coinbase.db';
	trigger.options.clientID = trigger.options.clientID || undefined;
	trigger.options.clientSecret = trigger.options.clientSecret || undefined;
	trigger.options.redirectURI = trigger.options.redirectURI || undefined;
	
	trigger.scope = 'wallet:accounts:read,wallet:sells:create,wallet:buys:create';
	trigger.db = (function() { try { return JSON.parse(fs.readFileSync(trigger.options.dbFile)); } catch(e) { return {}}})();

	trigger.options.clearcommand = trigger.options.clearcommand || '!clear';
	trigger.options.authcommand = trigger.options.authcommand || '!auth';
	trigger.options.saveTimer = trigger.options.saveTimer || 1000 * 60 * 5;
	trigger.options.sellcommand = trigger.options.sellcommand || '!sell';
	trigger.options.buycommand = trigger.options.buycommand || '!buy';
	trigger.options.balancecommand = trigger.options.balancecommand || '!balance';
	trigger.options.pricecommand = trigger.options.pricecommand || '!prices';
	return trigger;
}

BitcoinTrigger.prototype._onLoad = function() {
	const that = this;
	const withName = this.chatBot.name + '/' + this.name + ': ';
	if (this.options.saveTimer !== -1) {
		setInterval(() => {
			try {
				fs.writeFile(that.options.dbFile, JSON.stringify(that.db), function (e) {
					if (e) {
						that.winston.error(withName + 'Could not write to db file ' + e);
						return false;
					}
					else {
						that.winston.debug(withName + 'Wrote to db file');
					}
				});
			}
			catch (e) {
				that.winston.error(withName + 'Error: ' + e);
				return false;
			}
		}, that.options.saveTimer);
		return true;
	}
	if(!this.options.clientID || !this.options.clientSecret || !this.options.redirectURI || this.chatBot.options.disableWebserver === true) {
		this.winston.error(withName + 'Must specify client ID and client Secret and redirect URI and webserver enabled!');
		return false;
	}
	else {
		return true;
	}
}

BitcoinTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

BitcoinTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

BitcoinTrigger.prototype._respond = function(toId, userId, message) {
	const that = this;
	const withName = this.chatBot.name + '/' + this.name + ': ';
	if(!this.db[userId]) {
		this.db[userId] = {
			steamID: userId,
			accessToken: '',
			refreshToken: '',
			id: ''
		}
	}

	var query = this._stripCommand(message, this.options.balancecommand);
	if(query) {
		this._getBalance(toId, userId);
	}

	query = this._stripCommand(message, this.options.authcommand);
	if(query) {
		this._authorize(userId, function(e, access, refresh) {
			if(e) {
				that.winston.error(withName + e);
			}
			else {
				that.winston.silly(withName + 'Received accessToken and refreshToken');
				that._sendMessageAfterDelay(userId, 'Your coinbase access token and refresh token have been received and written to disk.');
			}
		});
	}

	query = this._stripCommand(message, this.options.clearcommand);
	if(query) {
		this.db[userId] = null;
		this._sendMessageAfterDelay(toId, 'Your database page has been cleared. You will need to reauthorize to use this trigger again.');
	}

	query = this._stripCommand(message, this.options.sellcommand);
	if(query && query.params.length === 3) {
		this._sell(toId, userId, query.params[1], query.params[2]);
	}

	query = this._stripCommand(message, this.options.buycommand);
	if(query && query.params.length === 3) {
		this._buy(toId, userId, query.params[1], query.params[2]);
	}

	query = this._stripCommand(message, this.options.pricecommand);
	if(query) {
		this._getPrices(toId, userId);
	}
}

BitcoinTrigger.prototype._getPrices = function(toId, userId) {
	const _db = this.db[userId];
	const client = new Coinbase.Client({
		"accessToken": _db.accessToken,
		"refreshToken": _db.refreshToken
	});
	const withName = this.chatBot.name + '/' + this.name + ': ';

	var sellPrice = '';
	var buyPrice = '';

	client.getBuyPrice({
		"currency": "USD"
	}, function(e, obj) {
		buyPrice = obj.data.amount;
	});
	client.getSellPrice({
		"currency": "USD"
	}, function(e, obj) {
		sellPrice = obj.data.amount;
	});

	setTimeout(() => {
		this._sendMessageAfterDelay(toId, 'Sell price: ' + sellPrice + '. Buy price: ' + buyPrice);
	}, 1000);
}

BitcoinTrigger.prototype._buy = function(toId, userId, amount, currency) {
	const withName = this.chatBot.name + '/' + this.name + ': ';
	const _db = this.db[userId];
	const client = new Coinbase.Client({
		"accessToken": _db.accessToken,
		"refreshToken": _db.refreshToken
	});
	const account = new Coinbase.model.Account(client, {
		"id": _db.id
	});

	const args = {
		"amount": amount,
		"currency": currency
	};

	account.buy(args, (e, xfer) => {
		if(e) {
			this.winston.error(withName + e.stack);
			this._sendMessageAfterDelay(toId, `Error buying ${amount} ${currency} for user ${userId}: ${e.message}`);
		}
		else {
			this._sendMessageAfterDelay(toId, `${userId} successfully bought ${amount} ${currency}!`);
			this._sendMessageAfterDelay(userId, `Transfer ID is ${xfer.id}`);
		}
	});
}

BitcoinTrigger.prototype._sell = function(toId, userId, amount, currency) {
	const that = this;
	const withName = this.chatBot.name + '/' + this.name + ': ';
	var _db = this.db[userId];
	const client = new Coinbase.Client({
		"accessToken": _db.accessToken,
		"refreshToken": _db.refreshToken
	});
	const account = new Coinbase.model.Account(client, { "id": _db.id });

	const args = {
		"amount": amount,
		"currency": currency
	};

	account.sell(args, function(e, xfer) {
		if(e) {
			that.winston.error(withName + e.stack);
			that._sendMessageAfterDelay(toId, 'Error selling ' + amount + ' ' + currency + ' for user ' + userId + ': ' + e.message);
		}
		else {
			that._sendMessageAfterDelay(toId, userId + ' successfully sold ' + amount + ' ' + currency + '!');
			that._sendMessageAfterDelay(userId, 'Transfer ID is ' + xfer.id);
		}
	});
}

BitcoinTrigger.prototype._refreshToken = function(toId, userId) {
	const that = this;
	const withName = this.chatBot.name + '/' + this.name + ': ';
	Request({
		method: "POST",
		uri: "https://coinbase.com/oauth/token" +
		"?grant_type=refresh_token&redirect_uri=" +
		that.options.redirectURI + "&client_id=" + that.options.clientID +
		"&client_secret=" + that.options.clientSecret +
		"&refresh_token=" + that.db[userId].refreshToken,
		json: true,
		followAllRedirects: true
	}, function(e, response, body) {
		if(e) {
			that.winston.error(withName + e);
		}
		else {
			that.db[userId].accessToken = body.access_token;
			that._sendMessageAfterDelay(toId, 'Access token refreshed!');
		}
	});
}

BitcoinTrigger.prototype._getId = function(userId) {
	var _db = this.db[userId];
	const withName = this.chatBot.name + '/' + this.name + ': ';
	const client = new Coinbase.Client({
		"accessToken": _db.accessToken,
		"refreshToken": _db.refreshToken
	});
	client.getAccounts({}, (e, accounts) => {
		if(e) {
			this.winston.error(withName + e.stack);
		}
		else {
			accounts.forEach(account => {
				_db.id = account.id;
			});
		}
	})
}

BitcoinTrigger.prototype._authorize = function(userId, callback) {
	const withName = this.chatBot.name + '/' + this.name + ': ';
	this.express = this.chatBot.express;
	var _url;
	var _code;
	var accessToken;
	var refreshToken;
	var uri = "https://coinbase.com/oauth/authorize" +
		"?response_type=code&redirect_uri=" + encodeURI(this.options.redirectURI) +
		"&client_id=" + this.options.clientID + '&scope=' + this.scope;
	Request({
		uri: uri,
		json: true,
		followAllRedirects: true
	}, (e, response, body) => {
		if(e) {
			callback(e, null, null);
		}
		else {
			this._sendMessageAfterDelay(userId, 'Please visit the following link and click "Authorize".\n\n' + uri);
			var last = /^[^\/]*(?:\/[^\/]*){2}/g;
			//console.log(that.options.redirectURI.match(last));
			var getter = this.options.redirectURI.replace(last, '');
			this.chatBot._addRouter(getter);
			this.express.use(getter, (req, res, next) => {
				_url = req.url;
				_code = _url.match(/\?code=(.*)/i)[1];
				res.send('<h1>Response received, you may close this window now.<h2>' + '<br><h4>Your code is ' + _code + '<h4><br>');
				Request({
					method: "POST",
					uri: "https://coinbase.com/oauth/token?grant_type=authorization_code&code=" +
						_code + "&client_id=" + this.options.clientID + "&client_secret=" +
						this.options.clientSecret + "&redirect_uri=" + this.options.redirectURI,
					json: true,
					followAllRedirects: true
				}, (e, response, body) => {
					if(!body.access_token) {
						callback(e, null, null);
					}
					else {
						accessToken = body.access_token;
						refreshToken = body.refresh_token;
						this.db[userId].accessToken = accessToken;
                        this.db[userId].refreshToken = refreshToken;
						this._getId(userId);
						callback(null, accessToken, refreshToken);
					}
				});
			});
		}
	});
}

BitcoinTrigger.prototype._getBalance = function(toId, userId) {
	const that = this;
	const withName = this.chatBot.name + '/' + this.name + ': ';
	if(!that.db[userId].accessToken || !that.db[userId].refreshToken) {
		this._sendMessageAfterDelay(userId, 'Please use ' + this.options.authcommand + ' to authorize before using this command.');
		return false;
	}
	else {
		var _db = that.db[userId];
		var client = new Coinbase.Client({
			"accessToken": _db.accessToken,
			"refreshToken": _db.refreshToken
		});
		client.getAccount(_db.id, (e, account) => {
			if(e) {
				if(e.message = "[ExpiredToken: The access token expired]") {
					this._refreshToken(toId, userId);
					this._sendMessageAfterDelay(toId, 'Access token expired, refreshing. Please try again in a few seconds.');
					this.winston.warn(withName + 'Refreshing access token');
				}
				else {
					this.winston.error(e.stack);
					this._sendMessageAfterDelay(userId, e.message);
					console.log(e.message);
				}
			}
			else {
				this._sendMessageAfterDelay(toId, 'The balance for ' + this.chatBot._userString(userId) + ' is ' + account.balance.amount + ' ' + account.balance.currency);
			}
		})
	}
}

BitcoinTrigger.prototype._stripCommand = function(message, command) {
	if (command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return {
			message: message,
			params: message.split(" ")
		};
	}
	return null;
}
