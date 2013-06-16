var fs = require('fs');

var TriggerFactory = function() {
	this.triggerTypes = {};
};

// Go through all files in the triggers directory and register the create function to the triggerType
TriggerFactory.prototype.loadModules = function() {
	var files = fs.readdirSync('./lib/triggers/');
	this.triggerTypes = {};

	for (var i=0; i < files.length; i++) {
		var moduleName = './triggers/' + files[i];

		// Clear the module cache so module updates can be loaded
		delete require.cache[require.resolve(moduleName)];
		var module = require(moduleName);

		if (module.triggerType && module.create) {
			this.triggerTypes[module.triggerType] = module.create;
		}
	}
}

// Call the registered create function
TriggerFactory.prototype.createTrigger = function(type, name, chatBot, options, refreshModules) {
	if (refreshModules) {
		this.loadModules();
	}

	if (type in this.triggerTypes) {
		return this.triggerTypes[type](name, chatBot, options);
	}
	return null;
}

exports.TriggerFactory = TriggerFactory;