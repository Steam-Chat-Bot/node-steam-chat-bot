var fs = require('fs');
var _ = require('underscore');

var TriggerFactory = function() {
	this.triggerTypes = {};
};

// Go through all files in the triggers directory and register the create function to the triggerType
TriggerFactory.prototype.loadModules = function() {
	var files = fs.readdirSync('./lib/triggers/');
	var that = this;
	_.each(files, function(file) {
		var module = require('./triggers/' + file);
		that.triggerTypes[module.triggerType] = module.create;
	});
}

// Call the registered create function
TriggerFactory.prototype.createTrigger = function(type, name, chatBot, options) {
	if (type in this.triggerTypes) {
		return this.triggerTypes[type](name, chatBot, options);
	}
	return null;
}

exports.TriggerFactory = TriggerFactory;