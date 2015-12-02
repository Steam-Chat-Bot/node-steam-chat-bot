const util = require('util');
const BaseTrigger = require('./baseTrigger.js').BaseTrigger;
const Request = require('request');
const Coinbase = require('coinbase');
const fs = require('fs');

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

	trigger.db = (function() { try { return JSON.parse(fs.readFileSync(trigger.options.dbFile)); } catch(e) { return {}}})();
	trigger.client;
	trigger.options.clearcommand = trigger.options.clearcommand || '!clear';
	trigger.options.authcommand = trigger.options.authcommand || '!auth';
	trigger.options.saveTimer = trigger.options.saveTimer || 1000 * 60 * 30;
	trigger.options.sellcommand = trigger.options.sellcommand || '!sell';
	trigger.options.buycommand = trigger.options.buycommand || '!buy';
	trigger.options.balancecommand = trigger.options.balancecommand || '!balance';
	trigger.options.sendcommand = trigger.options.sendcommand || '!send';
	trigger.options.requestcommand = trigger.options.requestcommand || '!request';
	trigger.options.pricecommand = trigger.options.pricecommand || '!prices';
	trigger.options.transcommand = trigger.options.transcommand || '!transfers';
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
				})
			}
			catch (e) {
				that.winston.error(withName + 'Error: ' + e);
				return false;
			}
		}, that.options.saveTimer);
		return true;
	}
	if(!this.options.clientID || !this.options.clientSecret || !this.options.redirectURI || this.chatBot.options.disableWebserver === true) {
		console.log(this.options.clientID);
		console.log(this.options.clientSecret);
		console.log(this.options.redirectURI);
		console.log(this.chatBot.options.disableWebserver);
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

	setInterval(function() {
		that._refreshToken(userId);
	}, 1000 * 60 * 60 * 2);
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
				that.db[userId].accessToken = access;
				that.db[userId].refreshToken = refresh;
				that.winston.silly(withName + 'Received accessToken and refreshToken');
				that._sendMessageAfterDelay(userId, 'Your coinbase access token and refresh token have been received and written to disk.');
			}
		});
	}

	query = this._stripCommand(message, this.options.clearcommand);
	if(query) {
		this.db[userId] = null;
		this._sendMessageAfterDelay(userId, 'Your database page has been cleared. You will need to reauthorize to use this trigger again.');
	}

	query = this._stripCommand(message, this.options.sellcommand);
	if(query && query.params.length === 2) {
		this._sell(toId, userId, query.params[1]);
	}
}

BitcoinTrigger.prototype._sell = function(toId, userId, amount) {
	const that = this;
	const withName = this.chatBot.name + '/' + this.name + ': ';
	var _db = this.db[userId];
	const client = new Coinbase.Client({
		"accessToken": _db.accessToken,
		"refreshToken": _db.refreshToken,
		'baseApiUri': 'https://api.sandbox.coinbase.com/v2/',
  		'tokenUri': 'https://api.sandbox.coinbase.com/oauth/token'
	});
	const account = new Coinbase.model.Account(client, { "id": _db.id });

	var args = {
		"qty": amount
	}

	account.sell(args, function(e, xfer) {
		if(e) {
			that.winston.error(withName + e.stack);
			that._sendMessageAfterDelay(toId, 'Error selling ' + amount + ' bitcoints for user ' + userId + ': ' + e.message);
		}
		else {
			that._sendMessageAfterDelay(toId, userId + ' successfully sold ' + amount + ' bitcoins!');
			that._sendMessageAfterDelay(userId, 'Transfer id is ' + xfer.id);
		}
	});
}

BitcoinTrigger.prototype._refreshToken = function(userId) {
	const that = this;
	const withName = this.chatBot.name + '/' + this.name + ': ';
	Request({
		method: "POST",
		uri: "https://sandbox.coinbase.com/oauth/token" +
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
			that._sendMessageAfterDelay(userId, 'Access token refreshed!');
		}
	})
}

BitcoinTrigger.prototype._getId = function(userId) {
	const that = this;
	var _db = that.db[userId];
	const withName = this.chatBot.name + '/' + this.name + ': ';
	const client = new Coinbase.Client({
		"accessToken": _db.accessToken,
		"refreshToken": _db.refreshToken,
		'baseApiUri': 'https://api.sandbox.coinbase.com/v2/',
  		'tokenUri': 'https://api.sandbox.coinbase.com/oauth/token'
	});
	client.getAccounts(function(e, accounts) {
		if(e) {
			that.winston.error(withName + e.stack);
		}
		else {
			_db.id === account.id;
		}
	})
}

BitcoinTrigger.prototype._authorize = function(userId, callback) {
	const that = this;
	const withName = this.chatBot.name + '/' + this.name + ': ';
	this.express = this.chatBot.express;
	var _url;
	var _code;
	var accessToken;
	var refreshToken;
	//var _scope = 'wallet:accounts:read,wallet:accounts:create,wallet:accounts:update,wallet:accounts:delete';
	var _scope = 'user,balance,sell';
	var uri = "https://sandbox.coinbase.com/oauth/authorize" +
		"?response_type=code&redirect_uri=" + encodeURI(that.options.redirectURI) +
		"&client_id=" + that.options.clientID + '&scope=' + _scope;
	Request({
		uri: uri,
		json: true,
		followAllRedirects: true
	}, function(e, response, body) {
		if(e) {
			callback(e, null, null);
		}
		else {
			that._sendMessageAfterDelay(userId, 'Please visit the following link and click "Authorize".\n\n' + uri);
			var last = /^[^\/]*(?:\/[^\/]*){2}/g;
			//console.log(that.options.redirectURI.match(last));
			var getter = that.options.redirectURI.replace(last, '');
			that.chatBot._addRouter(getter);
			that.winston.silly(getter);
			/*
			that.express.get(getter, function(req, res) {
				_url = req.url;
				_code = _url.match(/\?code=(.*)/i)[1];
				res.send('<h1>Response received, you may close this window now.<h2>' + '<br><h4>Your code is ' + _code + '<h4><br>');
				Request({
					method: "POST",
					uri: "https://sandbox.coinbase.com/oauth/token?grant_type=authorization_code&code=" +
						_code + "&client_id=" + that.options.clientID + "&client_secret=" +
						that.options.clientSecret + "&redirect_uri=" + that.options.redirectURI,
					json: true,
					followAllRedirects: true
				}, function(e, response, body) {
					if(!body.access_token) {
						callback(e, null, null);
					}
					else {
						accessToken = body.access_token;
						refreshToken = body.refresh_token;
						callback(null, accessToken, refreshToken);
					}
				});
			});
			*/
			that.express.use(getter, function(req, res, next) {
				_url = req.url;
				_code = _url.match(/\?code=(.*)/i)[1];
				res.send('<h1>Response received, you may close this window now.<h2>' + '<br><h4>Your code is ' + _code + '<h4><br>');
				Request({
					method: "POST",
					uri: "https://sandbox.coinbase.com/oauth/token?grant_type=authorization_code&code=" +
						_code + "&client_id=" + that.options.clientID + "&client_secret=" +
						that.options.clientSecret + "&redirect_uri=" + that.options.redirectURI,
					json: true,
					followAllRedirects: true
				}, function(e, response, body) {
					if(!body.access_token) {
						callback(e, null, null);
					}
					else {
						accessToken = body.access_token;
						refreshToken = body.refresh_token;
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
			"refreshToken": _db.refreshToken,
			'baseApiUri': 'https://api.sandbox.coinbase.com/v2/',
  			'tokenUri': 'https://api.sandbox.coinbase.com/oauth/token'
		});
		client.getAccounts({}, (e, accounts) => {
			if(e) {
				if(e.type === 'ExpiredAccessToken') {
					that._refreshToken(userId);
					that._sendMessageAfterDelay(userId, 'Access token expired, refreshing. Please try again in a few seconds.');
					that.winston.warn(withName + 'Refreshing access token');
				}
				that.winston.error(e);
				that._sendMessageAfterDelay(userId, e.message);
			}
			else {
				accounts.forEach(function(acct) {
					that._sendMessageAfterDelay(toId, 'The balance for ' + that.chatBot._userString(userId) + ' is ' + acct.balance.amount + ' ' + acct.balance.currency);
				})
			}
		})
	}
}

BitcoinTrigger.prototype._stripCommand = function(message, command) {
	if (command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
