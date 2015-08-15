/*
var getQuery = function() { //why can't I remember where I stole this from?
	var query = {};
	var params = window.location.search.substring(1).split("&");
	for (var i=0;i<params.length;i++) {
		var pair = params[i].split("=");
		query[pair[0]] = pair.splice(1).join('=');
	}
	return query;
}
*/

var escape=document.createElement('textarea'); var escapetext = function(html){
	escape.innerHTML=html;
	return escape.innerHTML;
}

String.prototype._pad=function(length,character){
	return new Array(length - this.length + 1).join(character || ' ') + this;
}

var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; var formatDate=function(timestamp){
	var date=new Date(timestamp);
	return String(months[date.getMonth()])+' '
	+ String(date.getDate())+' '
	+String(date.getHours())._pad(2,'0') + ':'
	+ String(date.getMinutes())._pad(2,'0') + ':'
	+ String(date.getSeconds())._pad(2,'0') + '';
}

var format=function(data){
	console.log(data);
	if(data.type === "ban"||data.type === "kick")
		data.message+=" by <a href='http://steamcommunity.com/profiles/"+data.actedId+"'>"+data.actedName+"</a>";
	return (data.roomId ? ("<span class='roomid'><a href='http://steamcommunity.com/gid/"+data.roomId+"'>"+
		(typeof roomNames === 'undefined' ? data.roomId :(roomNames[data.roomId]||data.roomId))+
		"</a>&nbsp;</span>"):"")+"<span class='time'>"+formatDate(data.time)+"&nbsp;</span>"+
		(data.type === 'user'||data.type === 'group' ? "&lt;" : "")+"<span class='userid'><a href='http://steamcommunity.com/profiles/"+
		data.userId+"' class='userid'>"+escapetext(data.displayName)+"</a>"+(data.type === 'user'||data.type === 'group' ? "&gt;" : "")+"&nbsp;</span>"
		+"<span class='"+data.type+"'>"+((data.type!=="ban"&&data.type!=="kick")?escapetext(data.message):data.message).replace(/\\n/g,'<br>');+"</span>";
}

var styles;
var socket;
var roomNames = {};
var readyFunc = function(){
	var options = {};
	if(document.location.hash) {
		var hash = document.location.hash.replace('#','').split('&');
		for(var i = 0; i < hash.length; i++) {
			var split = hash[i].split("=");
			options[split[0]] = split[1];
		}
	}
	socket = io(location.href.replace(location.hash,'')+".ws");
	document.time = new Date();
//	socket.on('connection',function(data){
//	});
	socket.on('styles', function(data) {
		styles = data;
		console.log(data);
		var el = document.getElementById('styles');
		for(var style in data) {
			if(style==='default') {
				document.getElementById('currentStyle').innerHTML = styles[style];
			} else if(!document.getElementById(style)) {
				var btn = document.createElement('button');
				btn.innerText = style.replace('.css','');
				btn.id=style;
				btn.className = "stylebutton";
				btn.data = data[style];
				btn.addEventListener('click', function(){
					document.getElementById('currentStyle').innerHTML = this.data;
				});
				el.appendChild(btn);
				console.log(style);
			}
		}
		socket.emit('options',options);
	});
	socket.on('roomNames',function(data){
		console.log('ROOMNAMES RECEIVED');
		roomNames = data;
		console.log(data);
		var first=true;
		for(var room in roomNames) {
			first = createRoomButton({room:room,roomName:roomNames[room],first:first});
		}
		if(options.room) {
			try {
				document.getElementById(options.room+"button").click();
			} catch(err) {
				console.log(err.stack);
			}
		}
	});
	socket.on('log',addLogLine);
}

var addLogLine = function(event){
	try{
		if(document.getElementById(event.time)) {
			return;
		}
		if(!document.getElementById(event.roomId)) {
			createRoomButton(event.roomId);
		}
		console.log(event);
		var li = document.createElement('li');
		li.id=event.time;
		li.innerHTML = Autolinker?Autolinker.link(format(event)):format(event);
		if(event.time > document.time) {
			document.getElementById(event.roomId).appendChild(li);window.scrollTo(0,document.body.scrollHeight);
		} else {
			li.className = 'oldChat';
			document.getElementById(event.roomId+'old').appendChild(li);window.scrollTo(0,document.body.scrollHeight);
		}
		document.getElementById(event.roomId+'button').style.display = 'inline-block';
	} catch(err) {
		console.log(err.stack);
	}
}

var createRoomButton = function(obj) {
	var first = obj.first;
	var room = obj.room;
	var roomName = obj.roomName;
	var chats = document.getElementById('chats');
	var titles = document.getElementById('titles');
	if(document.getElementById(room)) {
		return false;
	}
	if(!roomName) {
		roomName = room;
	}
	var newroom = document.createElement('ol');
	newroom.id = room;
	newroom.className = 'chats';
	var title = document.createElement('h1');
	title.className = 'title';
	var link = document.createElement('a');
	link.href = "https://steamcommunity.com/gid/"+room;
	link.innerText = roomName;
	link.target = "_blank";
	title.appendChild(link);
	newroom.appendChild(title);
	var oldchats = document.createElement('div');
	oldchats.id = room + 'old';
	oldchats.className = 'old';
	newroom.appendChild(oldchats);
	if(first) {
		first = false;
		document.title = "SteamLog: "+roomName;
	} else {
		newroom.style.display = 'none';
	}
	chats.appendChild(newroom);
	var roomLink = document.createElement('button');
	roomLink.id = room + 'button';
	roomLink.style.display = "none";
	roomLink.className = 'chatSelectorButton';
	roomLink.innerText = roomName;
	roomLink.addEventListener('click', function(){
		for(var i = 0; i < chats.children.length; i++) {
			chats.children[i].style.display = "none";
		}
		document.getElementById(this.id.replace('button','')).style.display="block";
		window.scrollTo(0,document.body.scrollHeight);
		document.title = "SteamLog: "+this.innerText;
	});
	titles.appendChild(roomLink);
	return first;
}
document.addEventListener('DOMContentLoaded', readyFunc, false);
/*
var ws=new WebSocket(host);
ws.onmessage=function(event){
	nib=event;"+(that.options.logLevel && that.options.logLevel!=="info"?"
	console.log(data);":"")+"
	if(JSON.parse(event.data).roomId===null) return;
	if(JSON.parse(event.data).type === 'roomNames')roomNames=JSON.parse(event.data).names
	else if(!window.location.hash ||window.location.hash === '#'+JSON.parse(event.data).roomId){
		var li=document.createElement('li');
		li.innerHTML=(Autolinker?Autolinker.link(format(JSON.parse(event.data))):format(JSON.parse(event.data)));
		document.querySelector('#pings').appendChild(li);window.scrollTo(0,document.body.scrollHeight);
	};
}
ws.onclose=function(){
	var li=document.createElement('li');
	//li.innerHTML='<li><a class="roomid"></a>&nbsp;<span class="time">'+formatDate((new Date()-0))+
	//'</span>&nbsp;<span href="http://steamcommunity.com/profiles/76561198141357312" class="disconnected">' +
	//You have been disconnected from the server!</span></li>';
	document.querySelector('#pings').appendChild(li);window.scrollTo(0,document.body.scrollHeight);
};
ws.onerror=function(){
	var li=document.createElement('li');
	//li.innerHTML='<li><a class="roomid"></a>&nbsp;<span class="time">'+
	formatDate((new Date()-0))+'</span>&nbsp;<span href="http://steamcommunity.com/profiles/76561198141357312" ' +
	'class="disconnected">You have been disconnected from the server!</span></li>';
	document.querySelector('#pings').appendChild(li);window.scrollTo(0,document.body.scrollHeight);
};
*/
