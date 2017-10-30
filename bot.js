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
var sParams = {
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

//Global Vars for Following
var toFollowBack = [];

//Global Vars for SStreaming ReTweet
var stream = T.stream('user');

//Intervals for timed events
var hourMultiplier = (1000 * 60 * 60);
var randomTweetInterval = (hourMultiplier * 3);
var periodicalFollowInterval = (hourMultiplier * 12);


console.log('The bot is starting...');
console.log('The tweets will go out once every ' + (randomTweetInterval / (1000 * 60)) + ' minute(s), or every ' + (randomTweetInterval / (1000 * 60 * 60)) + ' hour(s)');
console.log('The bot will double check for missed followers every ' + (periodicalFollowInterval / hourMultiplier) + " hour(s)");
console.log('');

stream.on('favorite', favorited);
// downloadImage();
// periodicalFollowIntervalHandler();
// setInterval(downloadImage, randomTweetInterval);
// setInterval(periodicalFollowIntervalHandler, periodicalFollowInterval)

/* FUNCTION SECTION
FAVOIRITE ACTION
*/

function favorited(eventMsg) {
  console.log('Favorited event!');
  // console.log(eventMsg.source);
  var id = eventMsg.source.id;
  var screenName = eventMsg.source.screen_name;
  var statusIdStr = eventMsg.target_object.id_str;
  var json = JSON.stringify(eventMsg);
  // fs.writeFile('favorited.json', json); 

  replyTo(screenName, statusIdStr);
}

function replyTo(favoriter, target) {
  const replyOptions = require('./replies.js');

  if (favoriter !== myScreenName) {
    var txt = '@' + favoriter + ' ';
    txt += randomResponse(replyOptions);

    console.log('Attempting to post: ' + txt);
    tweetIt(txt, target);
  }
}

function randomResponse(choices) {
  //takes an array of strings
  var choice = Math.floor(Math.random() * choices.length);
  return choices[choice];
}

function tweetIt(message, statusId) {
  var tweet = {
    status: message,
    in_reply_to_status_id: statusId,
    auto_populate_reply_metadata: true
  }
  T.post('statuses/update', tweet, callback);

  function callback(err, data, response) {
    if (err) {
      if (err.code == '186') {
        console.log('Status/@mention combination is too long. Trying a different response');
        tweetIt(message, statusId);
      } else {
        console.log('Function tweetIt encountered an error...')
        console.log(err);
        console.log('=================');
        tweetIt(message, statusId);
      }
    } else {
      console.log('Successfully posted: ' + message);
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
  bibleTrendTweet();
}

/* END FUNCTION SECTION
Download Image
 */

/* FUNCTION SECTION
DAILY FOLLOW BACK
 */

function periodicalFollowIntervalHandler() {
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

function followBack(object) {
  var successful = 0;
  console.log('Attempting to follow ' + object.length + ' users...');

  for (i = 0; i < object.length; i++) {
    var thisID = object[i].id;
    var thisUser = object[i].screenName;
    T.post('friendships/create', { id: thisID }, function (err, data, response) {
      if (!err) {
        successful++;
        //NEED TO ADD SOMETHING IN HERE THAT LETS ME GET A READ OUT OF WHO I JUST FAVORITED
        // console.log('Successfully followed @' + thisUser + '; User ID: ' + thisID);
      } else {
        T.post('friendships/create', { screen_name: thisUser }, function (err, data, response) {
          successful++;
          if (err) {
            console.log('couldnt fuckin do it bro...');
            // console.log(err.errors[0].code);
            twitterErrorLog(err);
          }
        })
      }
      //fractional report doesnt work here
    });
    //fractional report doesnt work here
  }
  console.log('Followed ' + successful + '/' + object.length)
}
/* END FUNCTION SECTION
DAILY FOLLOW BACK
 */
function twitterErrorLog(error) {
  fs.writeFile('error.json', error, function (err) {
    if (err) {
      console.log('FS Write File enountered an error...');
      console.log(err);
    }
  });
}


/* FUNCTION SECTION
FOLLOW BACK STREAM 
*/

/* END FUNCTION SECTION
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

/* FUNCTION SECTION
Random Bible Verse Tweet
*/

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