var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var createHandler = require('github-webhook-handler');
var _ = require('lodash');

/*
Tells you in chat when something happens to your repo. You need to set up a webhook as well.
room = string - where do you want events announced? REQUIRED.
path = string - where should github attach? (you might be running multiple bots on the same host. I am)
		Defaults to whatever you *name* the trigger. Path will be doubled because of the way this function works.
secret = string - use the same secret as you put in the webhook. You can consider it an API key for github to use when it connects to the bot.
showDetails = string - Show details of actions. IE the actual comment text added if true, otherwise just the username/place of the comment.
disabled, disabled = array - if you don't want *all* events enabled, then you should set a whitelist or blacklist with an array of items you want enabled/disabled.
			The individual values must be the event names from https://developer.github.com/v3/activity/events/types
			For subtypes like pullrequest actions, add the type, then / then the subtype. EG 'pull_request/synchronize'. * as a subtype means all subtypes.
			If you're using a blacklist *and* a whitelist, you need to explicitly add all subtypes to the blacklist/whitelist.
*/

var GithubTrigger = function() {
	GithubTrigger.super_.apply(this, arguments);
};

util.inherits(GithubTrigger, BaseTrigger);

var type = "GithubTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new GithubTrigger(type, name, chatBot, options);
	trigger.options.path = options.path || name;
	trigger.options.showDetails = options.showDetails === false ? false : true;
	trigger.options.disabled = options.disabled || false;
	trigger.options.enabled = options.enabled || false;
	trigger.db = (function(){try{return JSON.parse(fs.readFileSync(trigger.options.dbFile));}catch(err){return {}}})();
	return trigger;
};

GithubTrigger.prototype._onLoad = function() {
	var that = this;
	try {
		if(!(that.options.rooms instanceof Array && that.options.rooms.length>0)) {
			that.winston.error(that.chatBot.name+"/"+that.name+": options.rooms needs to be a single-length array");
			return false;
		}
		if(!that.options.secret) {
			that.winston.error(that.chatBot.name+"/"+that.name+": options.secret is required");
			return false;
		}
		that.handler = createHandler({path: that.options.path,secret:that.options.secret});
	} catch(err) {
		that.winston.error(that.chatBot.name+"/"+that.name,err.stack);
		return false;
	}
	var sm = function(text){
		_.each(that.options.rooms, function(room) {
			try {
				that._sendMessageAfterDelay(room,text);
			} catch(err) {
				that.winston.error(err.stack);
			}
		});
	}
	var sd = this.options.showDetails; //I should really start using NPP or something else that has autocompletion.
	this._addRouter(this.options.path).use(function(req, res) {
		that.winston.silly(that.chatBot.name+"/"+that.name+": Request inbound");
		that.handler(req, res, function(err) {
			that.winston.error(err);
			that.winston.silly(that.chatBot.name+"/"+that.name+": 404");
			res.statusCode = 404;
			res.end('no such location');
		});
	});
	this._callIfEnabled('*', function(event) {
		that.winston.silly(that.chatBot.name+"/"+that.name,event);
	});
	this.handler.on('error', function(err) {
		that.winston.error(that.chatBot.name+"/"+that.name+": Error: ",err);
	});
	this._callIfEnabled('commit_comment', function (event) {
		var c = event.payload.comment;
		var message = "GitHub: "+c.user.login+" has commented on "+c['commit_id'].substr(0,8);
		message += c.html_url.split(c.commit_id).join(c.commit_id.substr(0,10)); //cut the hash, it's too %*(&@# long.
		message += that.options.showDetails ? "\n"+c.body : "";
		sm(message);
	});
	this._callIfEnabled('create', function (event) {
		var p = event.payload;
		sm("GitHub: "+p.sender.login+" has created a new "+p['ref_type']+", "+p.ref+", in "+(sd?"https://github.com/":"")+p.repository['full_name']);
	});
	this._callIfEnabled('delete', function (event) {
		var p = event.payload;
		sm("GitHub: "+p.sender.login+" has deleted "+p['ref_type']+", "+p.ref+", from "+(sd?"https://github.com/":"")+p.repository['full_name']);
	});
//	this._callIfEnabled('deployment', function (event) {       });  //wtf is this?
//	this._callIfEnabled('deployment_status', function (event) {	}); //ditto
	this._callIfEnabled('fork', function (event) {
		var p = event.payload;
		sm("GitHub: "+p.repository['full_name']+" has been forked to "+(sd?p.html_url:p.forkee['full_name']));
	});
	this._callIfEnabled('gollum', function (event) {
		var p = event.payload;
		sm("GitHub: "+p.pages[0].page_name+" wiki page has been "+p.pages[0].action+(sd?"\n"+p.pages[0].html_url:""));
	});
	this._callIfEnabled('issue_comment', function (event) {
		var p = event.payload;
		var msg = "GitHub: "+p.issue.user.login+" has "+p.action+" a comment on "+p.issue.number;
		if(sd) {msg+=" ("+p.issue.title+")\n"+p.comment.body+"\n"+p.issue.html_url;}
		else {msg+= " at "+p.repository.full_name;}
		sm(msg);
	});
	this._callIfEnabled('issues', function (event) {
		var p = event.payload;

		if(!this._checkIfEnabled('issues/'+p.action) && !this._checkIfEnabled('issues/'+'*')) {
			return; //check for subtypes
		}

		var msg = "GitHub: "+p.sender.login+" has "+p.action+" issue "+p.issue.number+(sd?"":" at "+p.repository.full_name);
		msg += sd||p.action==="opened" ? " ("+p.issue.title+") " : "";
		if(p.action==="assigned") {
			msg+=" to "+p.issue.assignee.login;
		} else if(p.action==="unassigned") {
			msg += " from "+p.issue.assignee.login;
		} else if(p.action==="labeled") {
			msg += " as "+"<unknown, check debug log>";
		} else if(p.action==="unlabeled") {
			msg += " as "+"<unknown, check debug log>";
		} else if(p.action==="opened" && sd) {
			msg += "\n"+p.issue.body;;
		}
		if(sd) {
			msg += "\n"+p.issue.html_url;
		}
		sm(msg);
	});
	this._callIfEnabled('member', function (event) {
		var p = event.payload;
		sm("GitHub: "+p.sender.login+" has "+p.action+" "+p.member.login+" as a collaborator at "+(sd?p.repository.html_url:p.repository.full_name));
	});
//	this._callIfEnabled('membership', function (event) {	}); //MEH
//	this._callIfEnabled('page_build', function (event) {	}); //nobody cares
	this._callIfEnabled('public', function (event) { //nobody cares about this either, but whatever
		var p = event.payload;
		sm("GitHub: "+p.sender.login+" has made "+(sd?p.repository.html_url:p.repository.full_name)+(p.repository.private?" private":" public"));
	});
	this._callIfEnabled('pull_request_review_comment', function (event) {
		var p = event.payload;
		var pr = p.pull_request;
		var c = p.comment;
		var message = "GitHub: "+c.user.login+" has commented on pull request "+pr.number + (sd?" ("+pr.title+")":"");
		message += " at "+c.html_url+(that.options.showDetails ? "\n"+c.body : "");
		sm(message);
	});
	this._callIfEnabled('pull_request', function (event) {
		var p = event.payload;

		if(!this._checkIfEnabled('pull_request/'+p.action) && !this._checkIfEnabled('pull_request/'+'*')) {
			return; //check for subtypes
		}

		var pr = p.pull_request;
		var b = pr.base;
		var h = pr.head;

		var msg = "GitHub: "+p.sender.login+" has "+p.action+" pull request "+pr.number;
		msg += sd||p.action==="opened" ? " ("+pr.title+") " : "";
		msg+= " into "+b.repo.full_name+(b.ref?"#"+b.ref:"")+" from "+h.repo.full_name+(h.ref?"#"+h.ref:"");

		if(p.action==="assigned") {
			msg+=" to "+pr.assignee;
		} else if(p.action==="unassigned") {
			msg += " from "+pr.assignee;
		} else if(p.action==="labeled") {
			msg += " as "+"<unknown, check debug log>";
		} else if(p.action==="unlabeled") {
			msg += " as "+"<unknown, check debug log>";
		} else if(p.action==="opened" && sd) {
			msg += "\nFrom: ";
			msg += "\n"+pr.body;
		} else if(p.action==="closed" && sd && pr.merged) {
			msg+="\nThis pull was previously merged by "+pr.merged_by;
		}
		if(sd) {
			msg += "\n"+pr.html_url;
		}
		sm(msg);
	});
	this._callIfEnabled('push', function (event) {
		console.log(event);
		var p = event.payload;
		var h = p.head_commit;
		if(!h) { return; }
		var msg = "GitHub: "+p.sender.login+" has pushed "+(p.commits.length>1?"commits":"a commit");
		msg += sd ? "\n" +h.message+"\n"+h.url.split(h.id).join(h.id.substr(0,10)) : " to "+p.repository.full_name;
		sm(msg);
	});
//	this._callIfEnabled('repository', function (event) {	}); //MEH
	this._callIfEnabled('release', function (event) {
		console.log(event);
	}); //not implemented, not enough details yet.

	this._callIfEnabled('status', function (event) {
		console.log(event);
	}); //I don't even remember what this one does
//	this._callIfEnabled('team_add', function (event) {	}); //go away, team
//	this._callIfEnabled('watch', function (event) {	}); //if you want to see when someone stars you, implement it yourself and submit a pull request
	return true;
}

GithubTrigger.prototype._stripCommand = function(message, command){
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return message.substring(command.length+1);
	}
	return false;
}

GithubTrigger.prototype._callIfEnabled = function(hook,callback) {
	var that = this;
	if(!this._checkIfEnabled('hook')) {
		return false;
	}
	this.handler.on(hook, function(event) {
		try{
			callback(event);
		} catch(err) {
			that.winston.error(that.chatBot.name+"/"+that.name+": ERROR",err.stack);
		}
	});
}

GithubTrigger.prototype._checkIfEnabled = function(hook) {
	if((this.options.disabled && this.options.disabled.indexOf(hook) === -1) || (this.options.enabled && this.options.enabled.indexOf(hook) > -1)) {
		return true;
	}
	return false;
}
