When contributing by opening a pull request, please make sure you follow the style that already exists in the files. Some common examples:


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


- Use 3 equal signs (using 2 is only acceptable in CERTAIN situations)
```javascript
//bad
if(variable1 == variable2) {}
if(variable1 != variable2) {}

//good
if(variable1 === variable2) {}
if(variable1 !== variable2) {}
```


- Don't put semicolons after braces, put them after every other statement
```javascript
//bad
if(variable1 === variable2) {
    same = true
};

//good
if(variable1 === variable2) {
    same = true;
}
```


- Put spaces after commas, after parentheses (not before), before braces, etc...
```javascript
//bad
if(variable1===variable2){
    same=true;
}

//good
if (variable1 === variable2) {
    same = true;
}
```


- Don't create lines that are too long
```javascript
//bad
console.log('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890987654321');

//good
console.log('ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
'abcdefghijklmnopqrstuvwxyz' +
'1234567890987654321');
```


- Use single quotes
```javascript
//bad
console.log("Double quotes are BAD!");

//good
console.log('Single quotes are GOOD!");
```


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


Alright, thanks the end of my rant. I'm only writing this since I just spent hours (and 5 commits) fixing codacy stuff. Basically, don't do anything that would upset codacy.

I would also recommend following [this guide](https://github.com/airbnb/javascrip), which is where I got some of these from. Thanks, and happy coding!
