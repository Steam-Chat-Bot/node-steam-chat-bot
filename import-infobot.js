var storageDir = ''; //set this to the localStorage directory used by your bot
var dbFile = ''; //set this to the db you wish to use for your new bot. You may want to create it first by simply running the bot with the new module.










if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
}
var ueberDB = require('ueberDB');
var ubr = new ueberDB.database("sqlite", {filename:dbFile||'db.db'}, {writeInterval:1000});
var db = new LocalStorage(storageDir||'.');
var keys = db.keys;
console.log("Starting import");
process.stdout.write("Exporting: ");
ubr.init(function(err){
	if(err) {
		console.log(err);
		process.exit();
	} else for (var key in keys) {
		process.stdout.write(keys[key]+"        ");
		var factoid = JSON.parse(db.getItem(keys[key]));
		factoid.definition = [factoid.definition];
		ubr.set(keys[key],factoid);
		db.removeItem(keys[key]);
	}
	ubr.close(function(){console.log("\nDone!"); process.exit()});
});
