console.log('The bot is starting...');
var hourMultiplier = (1000 * 60 * 60);
var randomTweetInterval = (hourMultiplier * 3);
var periodicalFollowInterval = (hourMultiplier * 6);
console.log('the tweets will go out once every ' + (randomTweetInterval / (1000 * 60)) + ' minute(s), or every ' + (randomTweetInterval / (1000 * 60 * 60)) + ' hour(s)');
console.log('the bot will double check for missed followers every ' + (periodicalFollowInterval / hourMultiplier) + " hour(s)");

/* 
RANDOM TWEET 
 */

var fs = require('fs');
var download = require('download');

downloadImage();
periodicalFollowHandler();
setInterval(downloadImage, randomTweetInterval);
setInterval(periodicalFollowHandler, periodicalFollowInterval);

function downloadImage() {
  download('https://picsum.photos/1920/1080?random', 'img').then(() => {
    console.log('Downloaded a new image');
    uploadImage();
  });
}

var fs = require('fs');
var path = require('path');
var filename = 'img/1080.jpg';
var imgParams = {
  encoding: 'base64',
}
var b64;
var uploadID;

function uploadImage() {
  b64 = fs.readFileSync(filename, imgParams)
  T.post('media/upload', { media_data: b64 }, uploaded);
}

function uploaded(err, data, response) {
  console.log('Uploaded the image');
  uploadID = data.media_id_string;
  console.log(uploadID);
  bibleTrendTweet();
}

var Twit = require('twit');
var config = require('./config');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var T = new Twit(config);

var sParams = {
  q: 'eleven',
  geocode: '30.2672 97.7431 100mi',
  count: 10
}

/* 
DAILY FOLLOW BACK
 */
var toFollowBack = [];


function periodicalFollowHandler() {
  getNeedFollows(1, function (data) {
    followBack(data);
  });
}

function getNeedFollows(e, callback) {
  var unused = e;
  T.get('followers/list', { count: 200 }, function (err, data, response) {
    var userArray = data.users;
    var userCount = userArray.length;

    if (err) {
      console.log(err);
    } else {
      for (i = 0; i < userCount; i++) {
        var id = userArray[i].id;
        var screenName = userArray[i].screen_name;
        var isFollowing = userArray[i].following;

        if (isFollowing !== true) {
          var thisGuy = { id: id, screenName: screenName, isFollowing: isFollowing }
          toFollowBack.push(thisGuy);
        }
      }
    }
    callback(toFollowBack);
  })
}

//Follow Back
function followBack(object) {
  console.log('followBack scope...');

  for (i = 0; i < object.length; i++) {
    var thisID = object[i].id;
    var thisUser = object[i].screenName;
    T.post('friendships/create', { id: thisID }, function (err, data, response) {
      if (!err) {
        console.log('You followed User ID: ' + thisID + '; Scree Name: ' + thisUser);
      } else if (err === 108) {
        console.log('Trying agian using Screen Name');
        T.post('friendships/create', { screen_name: screenName }, function (err, data, response) {
          if (err) {
            console.log('couldnt fuckin do it bro...');
            console.log(err);
          }
        })
      }
    });
  }
}


/* 
FOLLOW BACK STREAM 
*/

// search for shit...not in use
//T.get('search/tweets', sParams, gotSearch);

// function gotSearch(err, data, response) {
//   var tweets = data.statuses;
//   for (var i = 0; i < tweets.length; i++) {
//     console.log(tweets[i].text);
//   }
// }

var topTrend;
var topHash;
var tCleanedArray = [];
var tParams = {
  id: '23424977' //united states WOE ID
  //woeid lookup http://woeid.rosselliot.co.nz/lookup/united%20states
}

function bibleTrendTweet() {
  T.get('trends/place', tParams, gotTrends);
}

function gotTrends(err, data, response) {
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
  // console.log(tCleanedArray[0]); //bingo bitch.
  topTrend = tCleanedArray[0];
  topHash = topTrend.name;
  // console.log(topHash);
  // console.log(topTrend.volume);
  getBibleVerse();
}


var tweet;

//T.post('statuses/update', tweet, tweeted);

function tweeted(err, data, response) {
  if (err) {
    console.log('Something went wrong: ' + err);
    // testErr(err);
    bibleTrendTweet();
  } else {
    console.log('It worked!');
  }
  // console.log(response); //annoying but good for testing.
}

//beginning of bible verse code
var request = require("request")

var url = "https://labs.bible.org/api/?" +
  "passage=random" +
  "&type=json";

var requestParams = {
  url: url,
  json: true
}
var verse;

function getBibleVerse() {
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

function testErr(error) { //function not working? 
  if (error === "Status is over 140 characters.") {//probably this test criteria
    console.log('we should try again...');
    bibleTrendTweet();
  }
}
