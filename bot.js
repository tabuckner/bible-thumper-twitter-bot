var Twit = require('twit');
var config = require('./config');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs');
var download = require('download');
var fs = require('fs');
var path = require('path');
var request = require("request")
const replyOptions = require('./replies.js');

//Global vars for Tweeting
var myScreenName = 'HillBillyNums';
var typingTime = 3000;
var T = new Twit(config);
var verse;
var favoriteResponse;
var sParfams = {
  q: 'eleven',
  geocode: '30.2672 97.7431 100mi',
  count: 10
}
var topTrend;
var topHash;
var tCleanedArray = [];
var tParams = {
  id: '23424977' //united states WOE ID
  //woeid lookup http://woeid.rosselliot.co.nz/lookup/united%20states
}
var tweet;
var url = "https://labs.bible.org/api/?" +
  "passage=random" +
  "&type=json";

//Global Vars for getting/downloading image
var filename = 'img/1080.jpg';
var imgParams = {
  encoding: 'base64',
}
var b64;
var uploadID;
var requestParams = {
  url: url,
  json: true
}

//Global Vars for Streaming ReTweet
var stream = T.stream('user');

//Intervals for timed events
var hourMultiplier = (1000 * 60 * 60);
var randomTweetInterval = (hourMultiplier * 3);
var periodicalFollowInterval = (hourMultiplier * 12);


console.log('The bot is starting...');
console.log('The tweets will go out once every ' + (randomTweetInterval / (1000 * 60)) + ' minute(s), or every ' + (randomTweetInterval / (1000 * 60 * 60)) + ' hour(s)');
console.log('The bot will double check for missed followers every ' + (periodicalFollowInterval / hourMultiplier) + " hour(s)");
console.log('');

stream.on('follow', followHandler);
stream.on('favorite', gotAFavorite);
downloadImage();
setInterval(downloadImage, randomTweetInterval);

/* FUNCTION SECTION
FOLLOW ACTION
*/

function followHandler(eventMsg) {
  var screen_name = eventMsg.source.screen_name;
  var id_str = eventMsg.source.id_str;

  if (screen_name !== myScreenName) {
    console.log(screen_name + ' is a now a follower! Attempting to follow back. in 30 seconds.');
    setTimeout(function () {
      followThemBack(screen_name, id_str)
    }, (30 * 1000));
  }
}

function followThemBack(screenName, idStr) {
  T.post('friendships/create', { screen_name: screenName }, function (err, data, response) {
    if (!err) {
      if (data.following == true) {
        console.log('We are now following ' + data.screen_name);
      }
      console.log('')
      saveTwitterData('followBackData.json', data);
    } else if (err) {
      saveTwitterData('followBackError.json', err);
    } else {
      console.log(response);
    }
  })
}

/* END FUNCTION SECTION
FOLLOW ACTION
*/

/* FUNCTION SECTION
FAVORITE ACTION
*/
function gotAFavorite(eventMsg) {
  // console.log(eventMsg.source);
  var id = eventMsg.source.id;
  var screenName = eventMsg.source.screen_name;
  var statusIdStr = eventMsg.target_object.id_str;
  var json = JSON.stringify(eventMsg);
  // saveTwitterData('favorite.json', eventMsg);  
  console.log('Got a Favorite from: ' + screenName);

  console.log('Waiting 15 seconds to send reply tweet...');
  setTimeout(function () {
    replyTo(screenName, statusIdStr);
  }, 15000);
}

function replyTo(favoriter, target) {
  const replyOptions = require('./replies.js');

  if (favoriter !== myScreenName) {
    favoriteResponse = "@" + favoriter + " ";
    randomResponse(replyOptions);
    console.log('Attempting to post: ' + favoriteResponse);
    tweetIt(favoriteResponse, target);
  }
}

function randomResponse(choices) {
  //takes an array of strings
  var choice = Math.floor(Math.random() * choices.length);
  favoriteResponse += choices[choice];
}

function tweetIt(message, statusId) {
  var tweet = {
    status: message,
    in_reply_to_status_id: statusId,
    auto_populate_reply_metadata: true
  }
  T.post('statuses/update', tweet, tweetedIt);

  function tweetedIt(err, data, response) {
    if (err) {
      if (err.code == '186') {
        console.log('Twitter Says: ' + err.message);
        console.log('Status/@mention combination is too long. Trying a different response');
        randomResponse(replyOptions);
        tweetIt(message, statusId);
      } else {
        console.log('Function tweetIt encountered an error...')
        console.log('Twitter Error Code: ' + err.code);
        console.log('Twitter Error Message: ' + err.message);
        console.log('=================');
        tweetIt(message, statusId);
      }
    } else {
      console.log("Successfully Tweeted: \"" + data.text + "\"");
    }
  }
}
/* END FUNCTION SECTION
FAVORITE ACTION
*/

/* FUNCTION SECTION
Download Image
 */
function downloadImage() {
  download('https://picsum.photos/1920/1080?random', 'img').then(() => {
    console.log('Downloaded a new image');
    uploadImage();
  });
}

function uploadImage() {
  b64 = fs.readFileSync(filename, imgParams)
  T.post('media/upload', { media_data: b64 }, uploaded);
}

function uploaded(err, data, response) {
  console.log('Uploaded the image');
  uploadID = data.media_id_string;
  console.log(uploadID);
  getTrendingTopics();
}

/* END FUNCTION SECTION
Download Image
*/


/* WHAT SECTION IS THIS??? */


function getTrendingTopics() {
  T.get('trends/place', tParams, gotTrendingTopics);
}

function gotTrendingTopics(err, data, response) {
  //console.log(data);
  var trends = data[0].trends;
  for (i = 0; i < trends.length; i++) {
    var name = trends[i].name;
    var volume = trends[i].tweet_volume;
    if (volume !== null && name.includes('#')) {
      var obj = {
        "name": name,
        "volume": volume
      };
      tCleanedArray.push(obj); //push to an array to be analyzed. 
    }
  }
  //pick out the top trending at that moment and log
  tCleanedArray.sort(function (b, a) {
    return a.volume - b.volume
  });
  topTrend = tCleanedArray[0];
  topHash = topTrend.name;
  getRandomBibleVerse();
}

function getRandomBibleVerse() {
  request(requestParams, requestHandler);
}

function requestHandler(error, response, body) {

  if (!error && response.statusCode === 200) {
    var verseObject = body[0];
    // console.log(verseObject) // Print the object of json response
    var verseBook = verseObject.bookname;
    var verseChapter = verseObject.chapter;
    var verseVerse = verseObject.verse;
    var verseText = verseObject.text;
    var versePosition = verseBook + " " + verseChapter + ":" + verseVerse;
    verse = versePosition + " // " + verseText + " " + topHash;
    // console.log(verse); //used for testing
    tweet = {
      status: verse,
      media_ids: uploadID
    }
    // console.log(tweet); //did we get the tweet object?
    T.post('statuses/update', tweet, tweeted);
  }
}

function tweeted(err, data, response) {
  if (err) {
    console.log('Something went wrong: ' + err);
    // testErr(err);
    getTrendingTopics();
  } else {
    console.log('It worked!');
  }
  // console.log(response); //annoying but good for testing.
}

/* END FUNCTION SECTION
Random Bible Verse Tweet
*/

//TOOLS
function testArrayLength(array, limit) { //small function to test an array of strings for a char limit (e.g. Twitter's 140)
  for (i = 0; i < array.length; i++) {
    if (array[i].length > limit) {
      console.log('--------------');
      console.log('Line ' + (i + 2));
      console.log(array[i].length + '/' + limit + '. Please remove ' + (array[i].length - limit) + 'chars');
      console.log(array[i]);
      console.log('--------------');
    } else {
      console.log('The array tested has passed.');
    }
  }
}

function saveTwitterData(filename, object) {
  var content = JSON.stringify(object);
  fs.writeFile('logs/' + filename, content, 'utf8', function (err) {
    if (err) {
      console.log(err)
    } else {
      console.log('Warning: Please reivew the log file located at: logs/' + filename);
    }
  });
}
