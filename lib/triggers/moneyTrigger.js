var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var request = require("request");
var money = require("money");
var accounting = require("accounting");
var TinyCache = require( "tinycache" );
var cache = new TinyCache();
/*
Trigger that converts between currencies
moneycommand = string - Command to convert currenices
currenciescommand = string - command to get list of valid currencies
apikey = string - api key from https://openexchangerates.org/
*/

var MoneyTrigger = function() {
	MoneyTrigger.super_.apply(this, arguments);
};

util.inherits(MoneyTrigger, BaseTrigger);

var type = "MoneyTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new MoneyTrigger(type, name, chatBot, options);
		trigger.options.moneycommand = trigger.options.moneycommand || "!money";
		trigger.options.currenciescommand = trigger.options.currenciescommand || "!currencies";
		trigger.respectsMute = false;
	return trigger;
};

// Return true if a message was sent
MoneyTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message.toUpperCase());
}

// Return true if a message was sent
MoneyTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message.toUpperCase());
}

MoneyTrigger.prototype._respond = function(toId, userId, message) {
	var that = this;
	var query = this._stripCommand(message, this.options.moneycommand);
	if(this.options.apikey && query && query.params.length === 4 && isNaN(query.params[3]) && isNaN(query.params[2]) && parseFloat(query.params[1])) {
		try {
			that._getRates(toId, query.params);
			return true;
		} catch(err) {
			that._sendMessageAfterDelay(toId, "Error: "+err);
			console.log(err.stack);
			return true;
		}
	} else if(!this.options.apikey) {
		this._sendMessageAfterDelay(toId, "I don't have an API key for openexchangerates.org!");
		return true;
	} else if(query) {
		this._sendMessageAfterDelay(toId, "'"+this.options.moneycommand+" 5.09 USD GBP' converts $5.09 to british pounds.");
		return true;
	}

	query = this._stripCommand(message, this.options.currenciescommand);
	if(this.options.apikey && query) {
		try {
			that._getCurrencies(toId, userId, query.params);
			return true;
		} catch(err) {
			that._sendMessageAfterDelay(toId, "Error: "+err);
			console.log(err.stack);
			return true;
		}
	} else if(!this.options.apikey) {
		this._sendMessageAfterDelay(toId, "I don't have an API key for openexchangerates.org!");
		return true;
	}
	return false;
}

MoneyTrigger.prototype._stripCommand = function(message, command) {
	if (command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	} else if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}
MoneyTrigger.prototype._getRates = function(toId, message) {
	var cmd = message;
	cmd[3] = cmd[3]||"USD";
	cmd[1] = parseFloat(cmd[1]); //it doesn't convert automatically with a decimal place. How sad. Also, two decimal places does weird things, so make sure the user knows.
	var that = this;
	if(!cache.get("money") || !money.base || !money.rates) {
		request.get({method:"GET",encoding:"utf8",uri:"http://openexchangerates.org/api/latest.json?app_id="+that.options.apikey,json:true,followAllRedirects:true}, function(error, response, data) {
			if (error) {
				try{
					that._sendMessageAfterDelay(toId, "Error "+response.statusCode + " obtaining conversion rates.");
					return true;
				} catch(err) {
					console.log(err.stack);
					that._sendMessageAfterDelay(toId, "Error obtaining conversion rates");
					return true;
				}
			}
			try {
				money.rates = data.rates;
				money.base = data.base;
				cache.put("money",data,3*60*60*1000);

				var result = accounting.toFixed(money(cmd[1]).from(cmd[2]).to(cmd[3]), 2);
				that._sendMessageAfterDelay(toId, cmd[1]+" "+cmd[2]+" is approximately "+result+" "+cmd[3]+".");
			} catch(err) {
				that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
				that._sendMessageAfterDelay(toId, "An error occurred! If Wolfram is loaded, please try converting with that!");
			}
			return true;
		});
	} else {
		var result = accounting.toFixed(money(cmd[1]).from(cmd[2]).to(cmd[3]), 2);
		this._sendMessageAfterDelay(toId, cmd[1]+" "+cmd[2]+" is approximately "+result+" "+cmd[3]+".");
		return true;
	}
}

MoneyTrigger.prototype._getCurrencies = function(toId, userId, params) {
	var that = this;
	if(!cache.get("currencies") || !money.base || !money.rates) {
		console.log(this.name+": fetching currency info");
		request.get({
			method:"GET",
			encoding:"utf8",
			uri:"http://openexchangerates.org/api/currencies.json?app_id="+that.options.apikey,
			json:true,
			followAllRedirects:true
		}, function(error, response, data) {
			if (error) {
				try{
					that._sendMessageAfterDelay(toId, "Error "+response.statusCode + " obtaining currency info.");
					return true;
				} catch(err) {
					console.log(err.stack);
					that._sendMessageAfterDelay(toId, "Error obtaining currency info");
					return true;
				}
			}
			cache.put("currencies",data,48*60*60*1000);
			if(params[1] && data[params[1]]) {
				that._sendMessageAfterDelay(toId, params[1] +" is "+ data[params[1]]);
				return true;
			} else if(params[1]) {
				that._sendMessageAfterDelay(toId, params[1] +" is not a valid currency code.");
				return true;
			} else {
				that._sendMessageAfterDelay(userId, "To get the full name of a currency, put it after the command. Valid currencies are: '"+Object.keys(data).join("', '")+"'");
				if(toId!==userId) {
					that._sendMessageAfterDelay(toId, "To get the full name of a currency, put it after the command. Use this command in private to get a list of currencies.");
				}
			}
		});
	} else {
		var data = cache.get("currencies");
		if(params[1] && data[params[1]]) {
			that._sendMessageAfterDelay(toId, params[1] +" is "+ data[params[1]]);
		} else if(params[1]) {
			that._sendMessageAfterDelay(toId, params[1] +" is not a valid currency code.");
		} else {
			that._sendMessageAfterDelay(userId, "To get the full name of a currency, put it after the command. Valid currencies are: '"+Object.keys(data).join("', '")+"'");
			if(toId!==userId) {
				that._sendMessageAfterDelay(toId, "To get the full name of a currency, put it after the command. Use this command in private to get a list of currencies.");
			}
		}
	}
	return true;
}
