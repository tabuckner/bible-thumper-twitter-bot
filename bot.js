const Twit = require('twit');

const config = require('./modules/static/config');
const dm = require('./modules/direct-message.js');
const fo = require('./modules/follow.js');
const fa = require('./modules/favorite.js');
const rb = require('./modules/verse.js');


//Global vars for Tweeting
myScreenName = 'HillBillyNums';
T = new Twit(config);

//Vars called on bot.js
var stream = T.stream('user');

//Intervals for timed events
var hourMultiplier = (1000 * 60 * 60);
var randomTweetInterval = (hourMultiplier * 3);
var periodicalFollowInterval = (hourMultiplier * 12);


console.log('The bot is starting...');
console.log('The tweets will go out once every ' + (randomTweetInterval / (1000 * 60)) + ' minute(s), or every ' + (randomTweetInterval / (1000 * 60 * 60)) + ' hour(s)');
console.log('The bot will double check for missed followers every ' + (periodicalFollowInterval / hourMultiplier) + " hour(s)");
console.log('');

stream.on('direct_message', dm.dmHandler);
stream.on('follow', fo.followHandler);
stream.on('favorite', fa.gotAFavorite);
rb.downloadImage();
setInterval(rb.downloadImage, randomTweetInterval);



