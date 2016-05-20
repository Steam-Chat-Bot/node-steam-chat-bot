var util = require("util");
var request = require("request");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;

/*
Trigger that looks up weather using Wunderground.com. Requires an API key.
	Example: New Orleans LA (70148): Clear, 70 F (21 C); Feels like 77.1 F (26 C). Calm winds. 78% Humidity[; 0.00 in 0# mm) precipitation today]. Last Updated on September 21, 7:31 PM CDT
	Example: Weather for Canoga Park, CA (91304): Partly Cloudy, 71.8 F (22.1 C). Last Updated on September 21, 8:52 PM PDT
	[Precipitation will only be included if higher than 0.]
conditions = string(!weather) - Command for *current* conditions.
forecast = string(!forecast) - command for forecast
forecastMetric = bool(false) - is forecast imperial (false) or metric (true)? Conditions is both, but forecast isn't :(
apikey = string - the apikey from wunderground. This is REQUIRED. Wunderground will NOT return results without an api key.
maxLines = int(3) - the maximum number of lines to return. Forecast returns like 9 lines (day/night for 4 days, plus first line). Private requests will always send all lines.
*/

var WeatherTrigger = function() {
	WeatherTrigger.super_.apply(this, arguments);
};

util.inherits(WeatherTrigger, BaseTrigger);

var type = "WeatherTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new WeatherTrigger(type, name, chatBot, options);
	trigger.options.conditions = options.conditions || "!weather";
	trigger.options.forecast = options.forecast || "!forecast";
	trigger.options.apikey = options.apikey || false;
	trigger.options.forecastMetric = options.forecastMetric || false;
	trigger.options.maxLines = options.maxLines || 3;
	if(!options.apikey) {
		chatBot.winston.error(chatBot.name+"/"+name+": Weather underground API key is REQUIRED");
		return false;
	}
	return trigger;
};

// Return true if a message was sent
WeatherTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
WeatherTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}


WeatherTrigger.prototype._respond = function(toId, userId, message) {
	var condition = this._stripCommand(message, this.options.conditions);
	var forecast = this._stripCommand(message, this.options.forecast);
	var endpoint;
	if(!condition && !forecast) {
		return false;
	}
	endpoint = condition ? "conditions" : "forecast";
	var location = forecast || condition;
	this.winston.debug(this.chatBot.name+"/"+this.name+": Checking Wunderground for " + location);
	var that = this;
	request.get({method:"GET", encoding:"utf8", json:true, followAllRedirects:true,
		uri:"https://api.wunderground.com/api/"+that.options.apikey+"/"+endpoint+"/q/"+location+".json"
	}, function(error, response, body) {
		if (error) {
			that._sendMessageAfterDelay(toId, "Wunderground is not responding correctly. An error has been logged. Please try again later.");
			that.winston.warn(that.chatBot.name+"/"+that.name+": Code " + response.statusCode + " from weather for steamid " + steamid);
			return;
		}
		if(!body) {
			that._sendMessageAfterDelay(toId, "Wunderground returned no results");
			return;
		}
		that._sendMessageAfterDelay(toId, that._getParsedResult(body,toId===userId)||"An error occurred");
	});
	return true;
}

WeatherTrigger.prototype._stripCommand = function(message, command) {
	if (command && message && message.toLowerCase().indexOf(command.toLowerCase() + " ") === 0) {
		return message.substring(command.length + 1);
	}
	return null;
}

WeatherTrigger.prototype._getParsedResult = function(weather,private) {
	try {
		if (weather.response && weather.response.results) {
			return "There was more than one matching location. Please be more specific (add state, country, zip code, lat+long, etc)";
		}
		if (weather.current_observation) {
			var o = weather.current_observation;
			var d = o.display_location;
			var result = "Weather for "+d.full+(d.zip?" ("+d.zip+")":"")+": "+o.weather+", "+o.temperature_string;
				+ "; Feels like "+o.feelslike_string+". "+o.wind_string+" winds. "+o.relative_humidity+"% humidity";
			if(parseInt(o.precip_today_metric)) {
				result += "; "+o.precip_today_string+" precipitation today";
			}
			return result+". "+o.observation_time+"\n"+o.forecast_url;
		}
		var f = weather.forecast.txt_forecast;
		var days = weather.forecast.txt_forecast.forecastday;
		var result = "Forecast for the next 3 days:";
		if (!private && days.length >= this.options.maxLines) {
			result+= " (send command privately for more output)";
		}
		for (var i=0; i<days.length; i++) {
			if(private || i < this.options.maxLines) {
				result+="\n"+days[i].title+": " + (this.options.forecastMetric ? days[i].fcttext_metric : days[i].fcttext);
			}
			if(parseInt(days[i].pop)) {
				result +=" "+days[i].pop+"% chance of precipitation.";
			}
		}
		return result;
	} catch(err) {
		this.winston.debug(err); //the error isn't really important, no need for details
		return "Wunderground returned no valid results for this location. Please try again later";
	}
}
