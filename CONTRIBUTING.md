---
layout: page
title: Contributing
tagline: Stylistic and other standards to comply with when submitting code
---

When contributing by opening a pull request, please make sure you follow the style that already exists in the files. PLEASE PLEASE PLEASE also check your pull request on [codacy](https://www.codacy.com/app/node-steam-chat-bot/steam-chat-bot/pullRequests?bid=2286175) so I don't need to spend 2 hours and 5 commits fixing all of your problems. Some common examples:


- Braces on the same line

- {% highlight javascript %}
//bad
for(var i = 0; i < 11; i++)
{
    console.log(i);
}
 
//good
for(var i = 0; i < 11; i++) {
    console.log(i);
}
{% endhighlight %}

<br>

- Use 3 equal signs (using 2 is only acceptable in CERTAIN situations)

- {% highlight javascript %}
//bad
if(variable1 == variable2) {}
if(variable1 != variable2) {}
 
//good
if(variable1 === variable2) {}
if(variable1 !== variable2) {}
{% endhighlight %}

<br>

- Don't put semicolons after braces, put them after every other statement

- {% highlight javascript %}
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
{% endhighlight %}

<br>

- Put spaces after commas, after parentheses (not before), before braces, etc...

- {% highlight javascript %}
//bad
if(variable1===variable2){
    same=true;
}
 
//good
if(variable1 === variable2) {
    same = true;
}
{% endhighlight %}

<br>

- Don't create lines that are too long

- {% highlight javascript %}
//bad
console.log('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890987654321');

//good
console.log('ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        'abcdefghijklmnopqrstuvwxyz' +
        '1234567890987654321');
{% endhighlight %}

<br>

- Use single quotes (only use double quotes in package.json)

- {% highlight javascript %}
//bad
console.log("Double quotes are BAD!");
 
//good
console.log('Single quotes are GOOD!');
{% endhighlight %}

<br>

- Don't put commas after a property if nothing follows

- {% highlight javascript %}
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
{% endhighlight %}

<br>

- Don't declare variables and not use them

- {% highlight javascript %}
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
{% endhighlight %}

<br>

- Don't put extra spaces after a line (efreak told me this)(you probably won't be able to see the space, but its there)(I think atom (my text editor) removes them automatically, but still don't do it)

- {% highlight javascript %}
//bad
console.log('space over here --->'); 
 
//good
console.log('no space --->');
{% endhighlight %}


That's the end of my guide. I'm only writing this since I just spent hours fixing codacy stuff. Basically, don't do anything that would upset codacy.

I would also recommend following [this guide](https://github.com/airbnb/javascript), which is where I got some of these from. Thanks, and happy coding!
-- @[dragonbanshee](https://github.com/dragonbanshee)

For your convenience as a linux user, there are symlinks to important files in the root (chatBot.js, triggers folder, baseTrigger.js). These won't work on Windows unless you're using cygwin to open files, as git for windows doesn't like symlinks. Sorry!
-- @[Efreak](https://github.com/Efreak)
