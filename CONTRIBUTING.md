When contributing by opening a pull request, please make sure you follow the style that already exists in the files. PLEASE PLEASE PLEASE also check your pull request on [codacy](https://www.codacy.com/app/node-steam-chat-bot/steam-chat-bot/pullRequests?bid=2286175) so I don't need to spend 2 hours and 5 commits fixing all of your problems. Some common examples:


- Braces on the same line
```javascript
//bad
for(var i = 0; i < 11; i++)
{
    console.log(i);
}
//good
for(var i = 0; i < 11; i++) {
    console.log(i);
}
```

<br>

- Use 3 equal signs (using 2 is only acceptable in CERTAIN situations)
```javascript
//bad
if(variable1 == variable2) {}
if(variable1 != variable2) {}
//good
if(variable1 === variable2) {}
if(variable1 !== variable2) {}
```

<br>

- Don't put semicolons after braces, put them after every other statement
```javascript
//bad
if(variable1 === variable2) {
    same = true;
};
console.log('bad bad bad')
//good
if(variable1 === variable2) {
    same = true;
}
console.log('good good good');
```

<br>

- Put spaces after commas, after parentheses (not before), before braces, etc...
```javascript
//bad
if(variable1===variable2){
    same=true;
}
//good
if(variable1 === variable2) {
    same = true;
}
```

<br>

- Don't create lines that are too long
```javascript
//bad
console.log('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890987654321');
//good
console.log('ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        'abcdefghijklmnopqrstuvwxyz' +
        '1234567890987654321');
```

<br>

- Use single quotes (only use double quotes in package.json)
```javascript
//bad
console.log("Double quotes are BAD!");
//good
console.log('Single quotes are GOOD!');
```

<br>

- Don't put commas after a property if nothing follows
```javascript
//bad 
var object = {
    this.first: 1,
    this.second: 2,
    this.third: 3,
}
//good
var object = {
    this.first: 1,
    this.second: 2,
    this.third: 3
}
```

<br>

- Don't declare variables and not use them
```javascript
//bad
prototype._respond = function() {
    var that = this;
    this.winston.info('Didn\'t use that, -10 points');
}
//good
prototype._respond = function() {
    var that = this;
    setTimeout(function() {
        that.winston.info('Used that, +10 points');
    }, 100);
}
```

<br>

- Don't put whitespace at the ends of lines. Detect with `/\s\s?+$/`, replace with `s/\s\s?+$//g`.
```javascript
//bad
console.log('space over here --->'); 
//good
console.log('no space --->');
```


That's the end of my guide. I'm only writing this since I just spent hours fixing codacy stuff. Basically, don't do anything that would upset codacy.

I would also recommend following [this guide](https://github.com/airbnb/javascript), which is where I got some of these from. Thanks, and happy coding!
-- @[dragonbanshee](https://github.com/dragonbanshee)

For your convenience as a linux user, there are symlinks to important files in the root (chatBot.js, triggers folder, baseTrigger.js). These won't work on Windows unless you're using cygwin to open files, as git for windows doesn't like symlinks. Sorry!
-- @[Efreak](https://github.com/Efreak)
