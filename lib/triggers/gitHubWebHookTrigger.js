var util = require("util");
var BaseTrigger = require("./baseTrigger.js").BaseTrigger;
var createHandler = require('github-webhook-handler');
var Express = require('express');
var _ = require('underscore');
/*
Tells you in chat when something happens to your repo. You need to set up a webhook as well.
room = string - where do you want events announced? REQUIRED.
path = string - where should github attach? (you might be running multiple bots on the same host. I am) Defaults to /GitHubWebHook
secret = string - use the same secret as you put in the webhook. You can consider it an API key for github to use when it connects to the bot.
showDetails = string - Show details of actions. IE the actual comment text added if true, otherwise just the username/place of the comment.
*/

var GitHubWebHookTrigger = function() {
	GitHubWebHookTrigger.super_.apply(this, arguments);
};

util.inherits(GitHubWebHookTrigger, BaseTrigger);

var type = "GitHubWebHookTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	var trigger = new GitHubWebHookTrigger(type, name, chatBot, options);
	trigger.options.path = options.path || '/GitHubWebHook';
	trigger.options.showDetails = options.showDetails || true;
	trigger.db = (function(){try{return JSON.parse(fs.readFileSync(trigger.options.dbFile));}catch(err){return {}}})();
	return trigger;
};

GitHubWebHookTrigger.prototype._onLoad = function() {
	if(!(this.options.rooms instanceof Array && this.options.rooms.length===1 && typeof this.options.rooms[0] === 'string')) {
		this.winston.error(this.chatBot.name+" "+this.name+": options.rooms needs to be a single-length array");
		return false;
	}
	if(!this.options.secret) {
		this.winston.error(this.chatBot.name+" "+this.name+": options.secret is required");
		return false;
	}
	var that = this;
	var sm = function(text){that._sendMessageAfterDelay(that.options.rooms[0],text);} //...yes, I'm lazy
	var sd = this.options.showDetails; //I should really start using NPP or something else that has autocompletion.
	var handler = createHandler({path: this.options.path,secret:this.options.secret});
	this.chatBot.router.use(this.options.path,function(req, res) {
		console.log("github webhook incoming");
		handler(req, res, function(err) {
			res.statusCode = 404;
			res.end('no such location')
		});
	});
/*
	handler.on('*', function(event) {
		console.log(event);
	});
*/
	handler.on('error', function(err) {
		that.winston.error(that.name+": Error: ");
		that.winston.error(err);
	});
	handler.on('commit_comment', function (event) {
		var c = event.payload.comment;
		var message = "GitHub: "+c.user.login+" has commented on "+c['commit_id'].substr(0,8);
		message += c.html_url.split(c.commit_id).join(c.commit_id.substr(0,10)); //cut the hash, it's too %*(&@# long.
		message += that.options.showDetails ? "\n"+c.body : "";
		sm(message);
	});
	handler.on('create', function (event) {
		var p = event.payload;
		sm("GitHub: "+p.sender.login+" has created a new "+p['ref_type']+", "+p.ref+", in "+(sd?"https://github.com/":"")+p.repository['full_name']);
	});
	handler.on('delete', function (event) {
		var p = event.payload;
		sm("GitHub: "+p.sender.login+" has deleted "+p['ref_type']+", "+p.ref+", from "+(sd?"https://github.com/":"")+p.repository['full_name']);
	});
//	handler.on('deployment', function (event) {       });  //wtf is this?
//	handler.on('deployment_status', function (event) {	}); //ditto
	handler.on('fork', function (event) {
		var p = event.payload;
		sm("GitHub: "+p.repository['full_name']+" has been forked to "+(sd?p.html_url:p.forkee['full_name']));
	});
	handler.on('gollum', function (event) {
		var p = event.payload; var pages="";
		sm("GitHub: "+p.pages[0].page_name+" wiki page has been "+p.pages[0].action+(sd?"\n"+p.pages[0].html_url:""));
	});
	handler.on('issue_comment', function (event) {
		var p = event.payload;
		var msg = "GitHub: "+p.issue.user.login+" has "+p.action+" a comment on "+p.issue.number
		if(sd) msg+=" ("+p.issue.title+")\n"+p.comment.body+"\n"+p.issue.html_url;
		else msg+= " at "+p.repository.full_name;
		sm(msg);
	});
	handler.on('issues', function (event) {
		var p = event.payload;
		var msg = "GitHub: "+p.sender.login+" has "+p.action+" issue "+p.issue.number+(sd?"":" at "+p.repository.full_name);
		msg += sd||p.action==="opened" ? " ("+p.issue.title+") " : "";
		if(p.action==="assigned") {
			msg+=" to "+p.issue.assignee;
		} else if(p.action==="unassigned") {
			msg += " from "+p.issue.assignee;
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
	handler.on('member', function (event) {
		var p = event.payload;
		sm("GitHub: "+p.sender.login+" has "+p.action+" "+p.member.login+" as a collaborator at "+(sd?p.repository.html_url:p.repository.full_name));
	});
//	handler.on('membership', function (event) {	}); //MEH
//	handler.on('page_build', function (event) {	}); //nobody cares
	handler.on('public', function (event) { //nobody cares about this either, but whatever
		var p = event.payload;
		sm("GitHub: "+p.sender.login+" has made "+(sd?p.repository.html_url:p.repository.full_name)+(p.repository.private?" private":" public"));
	});
	handler.on('pull_request_review_comment', function (event) {
		var p = event.payload;
		var pr = p.pull_request;
		var c = p.comment;
		var message = "GitHub: "+c.user.login+" has commented on pull request "+pr.number + (sd?" ("+pr.title+")":"");
		message += " at "+c.html_url+(that.options.showDetails ? "\n"+c.body : "");
		sm(message);
	});
	handler.on('pull_request', function (event) {
		console.log(event.payload);
		var p = event.payload;
		var pr = p.pull_request; var b = pr.base; var h = pr.head;
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
		} else if(p.action==="closed" && sd) {
			if(pr.merged) msg+="\nThis pull was previously merged by "+pr.merged_by;
		}
		if(sd) {
			msg += "\n"+pr.html_url;
		}
		sm(msg);
	});
	handler.on('push', function (event) {
		var p = event.payload; h = p.head_commit;
		var msg = "GitHub: "+p.sender.login+" has pushed "+(p.commits.length>1?"commits":"a commit");
		msg += sd ? "\n" +h.message+"\n"+h.url.split(h.id).join(h.id.substr(0,10)) : " to "+p.repository.full_name;
		sm(msg);
	});
//	handler.on('repository', function (event) {	}); //MEH
	handler.on('release', function (event) {
		var p = event.payload;
//unfinished		var msg = "GitHub: "+p.sender.login+" has "+p.action+" ";
	});
	handler.on('status', function (event) {
		var p = event.payload;
	});
	handler.on('team_add', function (event) {
		var p = event.payload;
	});
	handler.on('watch', function (event) {
		var p = event.payload;
	});
	return true;
}

GitHubWebHookTrigger.prototype._stripCommand = function(message, command){
	if (message.toLowerCase().indexOf(command.toLowerCase()) === 0) {
		return message.substring(command.length+1);
	}
	return false;
}
