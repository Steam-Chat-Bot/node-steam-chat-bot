var OMDBTrigger = require('../lib/triggers/omdbTrigger.js');

describe('OMDBTrigger', function() {
	var fakeBot;

	beforeEach(function() {
		fakeBot = jasmine.createSpyObj('fakeBot', ['sendMessage']);
	});

	it('should only respond to messages that start with the command', function() {
		var fakeOMDBClient = { movie: jasmine.createSpyObj('fakeOMDBClient', ['movies']) };
		var trigger = OMDBTrigger.create('OMDBTrigger', fakeBot, { command: '!movie', omdb: fakeOMDBClient } );

		expect(trigger.onFriendMessage('userId', '!movies is not the right command', false)).toEqual(false);
		expect(fakeOMDBClient.movie.movies).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', '!movies is not the right command', false)).toEqual(false);
		expect(fakeOMDBClient.movie.movies).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'movies is not the right command', false)).toEqual(false);
		expect(fakeOMDBClient.movie.movies).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'movies is not the right command', false)).toEqual(false);
		expect(fakeOMDBClient.movie.movies).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', 'movie is not the right command', false)).toEqual(false);
		expect(fakeOMDBClient.movie.movies).not.toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', 'movie is not the right command', false)).toEqual(false);
		expect(fakeOMDBClient.movie.movies).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('userId', '!movie is the right command', false)).toEqual(true);
		expect(fakeOMDBClient.movie.movies).toHaveBeenCalled();

		expect(trigger.onFriendMessage('roomId', 'userId', '!movie is the right command', false, false)).toEqual(true);
		expect(fakeOMDBClient.movie.movies).toHaveBeenCalled();
	});

	it('should not respond to messages that only contain the command', function() {
		var fakeOMDBClient = { movie: jasmine.createSpyObj('fakeOMDBClient', ['movies']) };
		var trigger = OMDBTrigger.create('OMDBTrigger', fakeBot, { command: '!movie', omdb: fakeOMDBClient } );

		expect(trigger.onFriendMessage('userId', '!movie', false)).toEqual(false);
		expect(fakeOMDBClient.movie.movies).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('roomId', 'userId', false, false)).toEqual(false);
		expect(fakeOMDBClient.movie.movies).not.toHaveBeenCalled();
	});

	it('should strip out the command before querying omdb', function() {
		var fakeOMDBClient = { movie: jasmine.createSpyObj('fakeOMDBClient', ['movies', 'year']) };
		var trigger = OMDBTrigger.create('OMDBTrigger', fakeBot, { command: '!movie', omdb: fakeOMDBClient } );

		expect(trigger.onFriendMessage('userId', '!movies should be stripped', false)).toEqual(true);
		expect(fakeOMDBClient.movie.movies).toHaveBeenCalled();
		expect(fakeOMDBClient.movie.movies.calls[0].args[0].q).toEqual('should be stripped');

		expect(trigger.onFriendMessage('roomId', 'userId', '!movies should be stripped', false, false)).toEqual(true);
		expect(fakeOMDBClient.movie.movies).toHaveBeenCalled();
		expect(fakeOMDBClient.movie.movies.calls[0].args[0].q).toEqual('should be stripped');
	});

	it('should query omdb with a year if it\'s specified', function() {
		var fakeOMDBClient = { movie: jasmine.createSpyObj('fakeOMDBClient', ['movies']) };
		var trigger = OMDBTrigger.create('OMDBTrigger', fakeBot, { command: '!movie', omdb: fakeOMDBClient } );

		expect(trigger.onFriendMessage('userId', '!movie movie 2015', false)).toEqual(true);
		expect(fakeOMDBClient.movie.year).toHaveBeenCalled();

		expect(trigger.onChatMessage('roomId', 'userId', '!movie movie 2015', false, false)).toEqual(true);
		expect(fakeOMDBClient.movie.year).toHaveBeenCalled();
	});

	it('should query omdb without a year and return the first result', function() {
		var fakeOMDBClient = { movie: jasmine.createSpyObj('fakeOMDBClient', ['movies']) };
		var trigger = OMDBTrigger.create('OMDBTrigger', fakeBot, { command: '!movie', omdb: fakeOMDBClient } );

		expect(trigger.onFriendMessage('userId', '!movie movie', false)).toEqual(true);
		expect(fakeOMDBClient.movie.year).not.toHaveBeenCalled();

		expect(trigger.onFriendMessage('roomId', 'userId', '!movie movie 2015', false, false)).toEqual(true);
		expect(fakeOMDBClient.movie.year).toHaveBeenCalled();
	});
});
