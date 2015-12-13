$(document).ready(function(){
	var success = $('#success');
	var error = $('#error');
	success.hide();
	error.hide();
	$('#keysTitle').click(function(){$('#keysTable').toggle()});
	$('table').hide(); //hide all tables by default.

	$.ajaxSetup({
		xhrFields: {
			withCredentials: true
		}
	});
	var post = function(url,data) {
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			complete: displayResult,
			dataType: 'application/json'
		});
	}
	var showError = function(err) {
		error.innerHTML = err ||"Error!";
		error.show();
		setTimeout(function(){error.hide()},5000);
	}
	var displayResult = function(data) {
		if(!data || !data.responseText){
			showError();
			return;
		}
		var data = JSON.parse(data.responseText);
		if(data.error) {
			displayError(data.error);
			return;
		}
		success.innerHTML = 'Success!';
		success.show();
		setTimeout(function(){success.hide()},5000);
		if(data.keys) {
			document.getElementById('keysBody').innerHTML="";
			for(var key in data.keys.used) {
				addRow(data.keys.used[key]);
			}
			for(var key in data.keys.approved) {
				addRow(data.keys.approved[key]);
			}
			for(var key in data.keys.unapproved) {
				addRow(data.keys.unapproved[key]);
			}
		}
	}
	var addKey = function(event){
		post("addkey",{
			game: $('#game').val(),
			secretname: $('#secretname').val(),
			key: $('#key').val(),
			obfuscatedkey: $('#obfuscatedkey').val(),
			donor: $('#donor').val(),
			message: $('#message').val()
		});
	}
	var delKey = function(time){
		post("delkey",{
			time:time
		});
	}
	var approveKey = function(time){
		post("approvekey",{
			time:time
		});
	}
	var dropKey = function(time,public){
		post("dropkey",{
			time:time,
			public:public?true:false
		});
	}
	var getKeys = function(){
		post("getkeys");
	}
	$('#sendButton')    .click(addKey);
	getKeys();

	var addRow = function(data) {
		var row = document.createElement('tr');
		row.id=data.addedtime;

		var controls = document.createElement('td');
		if(!data.approvedtime && !data.mine) {
			var approve = document.createElement('a');
			$(approve).click(function(){
				approveKey(data.addedtime);
			});
			approve.innerHTML = "<span>&#10004</span>";
			approve.className = "approveButton";
			approve.href="#";
			approve.title = "Move key from unapproved to approved list";
			controls.appendChild(approve);
			controls.appendChild(document.createTextNode(" "));
		}
		if(!data.usedby && data.approvedby && !data.mine) {
			var public = document.createElement('input');
			public.title = "If this box is checked, the key will be dropped in the public chat. Otherwise the bot will chose a random user to receive the key, then post the key in chat 5 minutes later. If there is no key and only a message, it is assumed that this is not a key (that it is a gift) and the bot will not do anything if this is checked.";
			public.type="checkbox";
//			public.checked=true; //default should be private
			public.id=data.addedtime+"public";
			public.className = "publicCheck";
			controls.appendChild(public);
			controls.appendChild(document.createTextNode(" "));

			var drop = document.createElement('a');
			$(drop).click(function(){
				dropKey(data.addedtime,document.getElementById(data.addedtime+"public").checked);
			});
			drop.title = "Drop key in chat";
			drop.innerHTML = "<span>Drop</span>";
			drop.className = "dropButton";
			drop.href="#";
			controls.appendChild(drop);
			controls.appendChild(document.createTextNode(" "));
		}
		var del = document.createElement('a');
		$(del).click(function(){
			delKey(data.addedtime);
		});
		del.innerHTML = "<span>Del</span>";
		del.className = "deleteButton";
		del.href="#";
		del.title="Delete key from bot entirely. There is no going back and no backup here.";
		controls.appendChild(del);
		row.appendChild(controls);

		var game = document.createElement('td');
		game.textContent=data.game;
		row.appendChild(game);

		var secretname = document.createElement('td');
		secretname.textContent=data.secretname;
		row.appendChild(secretname);

		var key = document.createElement('td');
		key.textContent=data.key;
		row.appendChild(key);

		var obfuscatedkey = document.createElement('td');
		obfuscatedkey.textContent=data.obfuscatedkey;
		row.appendChild(obfuscatedkey);

		var donor = document.createElement('td');
		if(data.donor) {donor.textContent=data.donor;}
		donor.className="usercell";
		row.appendChild(donor);

		var addedby = document.createElement('td');
		var link = document.createElement('a');
		link.href="https://steamcommunity.com/profiles/"+data.addedby;
		link.textContent = data.addedby;
		addedby.appendChild(link);
		addedby.className="usercell";
		row.appendChild(addedby);

		var addedtime = document.createElement('td');
		addedtime.textContent = new Date(parseInt(data.addedtime)).toString();
		addedtime.className="timecell";
		row.appendChild(addedtime);

		var approvedby = document.createElement('td');
		if(data.approvedby) {
			var link = document.createElement('a');
			link.href="https://steamcommunity.com/profiles/"+data.approvedby;
			link.textContent = data.approvedby;
			approvedby.appendChild(link);
		}
		approvedby.className="usercell";
		row.appendChild(approvedby);

		var approvedtime = document.createElement('td');
		if(data.approvedtime) { approvedtime.textContent = new Date(parseInt(data.approvedtime)).toString();}
		approvedtime.className="timecell";
		row.appendChild(approvedtime);

		var usedby = document.createElement('td');
		if(data.usedby) {
			var link = document.createElement('a');
			link.href="https://steamcommunity.com/profiles/"+data.usedby;
			link.textContent = data.usedby;
			usedby.appendChild(link);
		}
		usedby.className="usercell";
		row.appendChild(usedby);

		var usedtime = document.createElement('td');
		if(data.usedtime) { usedtime.textContent = new Date(parseInt(data.usedtime)).toString();}
		usedtime.className="timecell";
		row.appendChild(usedtime);

		var message = document.createElement('td');
		if(data.message) { message.textContent = data.message;}
		message.className = "msgcell";
		row.appendChild(message);

		document.getElementById('keysBody').appendChild(row);
	}
});

