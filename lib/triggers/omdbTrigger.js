var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var omdb = require('omdb');
/*
Trigger that looks up a movie on omdb (http://www.omdbapi.com/)
command - defaults to !movie
*/

var OMDBTrigger = function() {
	OMDBTrigger.super_.apply(this, arguments);
};

util.inherits(OMDBTrigger, BaseTrigger);

var type = "OMDBTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new OMDBTrigger(type, name, chatBot, options);
		trigger.options.command = trigger.options.command || "!movie";
	return trigger;
};

// Return true if a message was sent
OMDBTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, userId, message);
}

// Return true if a message was sent
OMDBTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, chatterId, message);
}

OMDBTrigger.prototype._respond = function(roomId, userId, message) {
	var query = this._stripCommand(message, this.options.command);
	var that = this;
	if(query) {
		omdb.get({
			title: query.params[1],
			year: query.params[2]
		},function(err,movie){
			if(err) {
				that._sendMessageAfterDelay(roomId, "Error!");
				that.winston.error("ERROR: " + err.stack);
				return console.error(err);
			}

			if(!movie) {
				that._sendMessageAfterDelay(roomId, "Movie not found!");
				return true;
			}
			var result = "Title: " + movie.title + ". Year: " + movie.year;
			if(movie.rated) {
				result += ". Rated: " + movie.rated;
			}

			result += ". Runtime: " + movie.runtime + " minutes";
			if(movie.genres) {
				result += ". Genres: " + movie.genres.join(", ");
			}
			if(movie.imdb && movie.imdb.rating && movie.imdb.votes) {
				result += ". Rating: " + movie.imdb.rating + " stars from " + movie.imdb.votes;
			}

			if(movie.director) {
				result += ". Director: " + movie.director;
			}
			if(movie.writers) {
				result += ". Writers: " + movie.writers.join(", ");
			}
			if(movie.actors) {
				result += ". Actors: " + movie.actors.join(", ");
			}

			if(movie.plot) {
				result += ".\nPlot: " + movie.plot;
			}

			if(movie.imdb && movie.imdb.id) {
				result += "\nFor more information, visit http://imdb.com/title/" + movie.imdb.id;
			}
			that._sendMessageAfterDelay(roomId,result);
		});
	} else {
		return false;
	}
	return true;
}

OMDBTrigger.prototype._stripCommand = function(message, command) {
	if (command && message && message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	} 
	else if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase()) === 0) {
		return {message: message, params: message.split(" ")};
	}
	return null;
}