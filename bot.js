var Twit = require('twit');
var config = require('./static/config');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs');
var download = require('download');
var fs = require('fs');
var path = require('path');
var request = require("request");
// var rp = require("request-promise-native"); //migrated these to direct-message.js
const replyOptions = require('./static/replies.js');
// const deflectionOptions = require('./static/deflection.js'); //migrated these to direct-message.js

const dm = require('./direct-message.js');
const f = require('./follow.js');

//Global vars for Tweeting
/* var  */myScreenName = 'HillBillyNums';
var typingTime = 3000;
/* var  */T = new Twit(config);
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

//Global Vars for getting/downloading image
var filename = 'img/1080.jpg';
var imgParams = {
  encoding: 'base64',
}
var b64;
var uploadID;
var bibleURL = "https://labs.bible.org/api/?" +
  "passage=random" +
  "&type=json";
var bibleParams = {
  url: bibleURL,
  json: true
}

//Global Vars for DM responses //migrated these to direct-message.js
/* var dmResponsesAry = [];
var dmTypingTime = 45000;
var dmURL = "https://talaikis.com/api/quotes";
var usersMessage;
var dmPullCounter = 0;
var dmPullIterations = 5; */
// var maxDMPullIterations; //might need this when i break everything...

//Global Vars for Streaming 
var stream = T.stream('user');

//Intervals for timed events
var hourMultiplier = (1000 * 60 * 60);
var randomTweetInterval = (hourMultiplier * 3);
var periodicalFollowInterval = (hourMultiplier * 12);


console.log('The bot is starting...');
console.log('The tweets will go out once every ' + (randomTweetInterval / (1000 * 60)) + ' minute(s), or every ' + (randomTweetInterval / (1000 * 60 * 60)) + ' hour(s)');
console.log('The bot will double check for missed followers every ' + (periodicalFollowInterval / hourMultiplier) + " hour(s)");
console.log('');

// stream.on('direct_message', dm.dmHandler);
stream.on('follow', f.followHandler);
// stream.on('favorite', gotAFavorite);
// downloadImage();
// setInterval(downloadImage, randomTweetInterval);


/* FUNCTION SECTION //migrated these to direct-message.js
DIRECT MESSAGE
*/

/* function dmHandler(messageObj) {
  var screen_name = messageObj.direct_message.sender.screen_name;
  var id_str = messageObj.direct_message.sender.id_str;
  var message = messageObj.direct_message.text;
  var dmUser = {
    screen_name: screen_name,
    id_str: id_str,
    text: message
  }

  if (screen_name !== myScreenName) {
    console.log('Received a DM!');
    console.log('User @' + dmUser.screen_name + " (" + dmUser.id_str + "): " + dmUser.text);
    createDMResponse(dmUser);
  }
}

function createDMResponse(dmUser) {

  if (dmUser.screen_name !== myScreenName) {  //if the dmResponse array is empty.
    if (dmResponsesAry.length === 0) {
      console.log('DM Response Array is empty. Pulling a new list.');
      getDMResponses(dmUser);
    } else {  //if we already have some choices we can check
      console.log('DM Response Array has values. Using current set.');
      dmPullCounter = 0;
      findPromiseResponse(dmUser);
    }
  }
}

function getDMResponses(dmUser) {
  var message = dmUser.text;
  console.log('getDMResponses Pull #' + (dmPullCounter + 1));
  rp(dmURL)
    .then(function (data) {
      data = JSON.parse(data);
      findPromiseResponse(dmUser, data);
    })
    .catch(function (err) {
      console.log('getDMResponses threw` an error:');
      console.log(err.name);
      console.log(err.statusCode);
      console.log(err);
    });
  dmPullCounter++
}

function findPromiseResponse(dmUser, data) {
  var noMatchSet = [];
  var matchSet = [];
  var message = dmUser.text.toLowerCase();

  for (i = 0; i < data.length; i++) {
    var thisCategory = data[i].cat;
    var thisQuote = data[i].quote;
    var thisPair = {};

    if (message.indexOf(thisCategory) === -1) {
      noMatchSet.push(thisCategory);
    } else {
      thisPair = {
        cat: thisCategory,
        quote: thisQuote
      }
      matchSet.push(thisPair);
    }
  }

  if (matchSet.length < 1) { // if we dont have matches
    console.log('==No Matches Found.==');
    console.log('===================');
    if (dmPullCounter < dmPullIterations) { // if we havent reached our iteration cap
      getDMResponses(dmUser); //take a look at this
    } else {
      deflectOrContinue(dmUser);
    }
  } else { // if we did find some matches
    var selector = Math.floor(Math.random() * matchSet.length);
    var reply = matchSet[selector].quote;

    console.log('Attempting to reply to @' + dmUser.screen_name + ' with "' + reply + '"'); //logs out the selected response
    sendDMReply(dmUser, reply);
  }
}

function deflectOrContinue(dmUser) { // 1/3 chance to either deflect, try again, or do nothing
  var rand = Math.random();

  if (rand >= (0) && rand <= (1 / 3)) { // 0 and 1/3
    //try again
    console.log('*****No matches found in ' + dmPullIterations + ' attempts. Starting Over*****');
    dmPullCounter = 0;
    getDMResponses(dmUser);
  } else if (rand >= (1 / 3) && rand <= (2 / 3)) { // 1/3 and 2/3
    //deflect
    console.log('*****Responding Using Deflection*****');
    var selector = Math.floor(Math.random() * deflectionOptions.length);
    var deflection = deflectionOptions[selector];
    console.log('we should use deflection option: "' + deflection + '" as our reply text.');
    sendDMReply(dmUser, deflection);
    dmPullCounter = 0;
  } else { // 2/3 and 1
    //do nothing
    dmPullCounter = 0;
    console.log('*****Successfully Terminated the DM Response Without a Reply*****');
  }
}

function sendDMReply(dmUserObj, reply) {
  var dmParams = {
    screen_name: dmUserObj.screen_name,
    user_id: dmUserObj.user_id,
    text: reply
  }
  setTimeout(function () {
    T.post('direct_messages/new', dmParams, sentDMReply);
  }, 1500);
  dmPullCounter = 0;
}

function sentDMReply(err, res, data) {
  if (!err) {
    console.log('Successfully replied to the DM.');
  } else {
    console.log(err);
  }
} */

/* END FUNCTION SECTION
DIRECT MESSAGE
*/


/* FUNCTION SECTION
FOLLOW ACTION
*/

/* function followHandler(eventMsg) {
  var screen_name = eventMsg.source.screen_name;
  var id_str = eventMsg.source.id_str;

  if (screen_name !== myScreenName) {
    console.log(screen_name + ' is a now a follower! Attempting to follow back in 10 seconds.');
    setTimeout(function () {
      followThemBack(screen_name, id_str)
    }, (10 * 1000));
  } else {
    console.log('');
  }
}

function followThemBack(screenName, idStr) {
  T.post('friendships/create', { screen_name: screenName }, function (err, data, response) {
    if (!err) {
      if (data.following == true) {
        console.log('We are now following ' + data.screen_name);
      }
      console.log('')
    } else if (err) {
    } else {
      console.log('Unexpected outcome at followThemBack:');
      console.log(response);
    }
  })
} */

/* END FUNCTION SECTION
FOLLOW ACTION
*/

/* FUNCTION SECTION
FAVORITE ACTION
*/
function gotAFavorite(eventMsg) {
  var id = eventMsg.source.id;
  var screenName = eventMsg.source.screen_name;
  var statusIdStr = eventMsg.target_object.id_str;
  var json = JSON.stringify(eventMsg);

  console.log('Got a Favorite from: ' + screenName);
  if (eventMsg.target_object.in_reply_to_status_id !== null) {
    console.log('Not replying in an attempt to avoid another account lock.');
  } else {
    console.log('Waiting 15 seconds to send reply tweet...');
    setTimeout(function () {
      replyTo(screenName, statusIdStr);
    }, 15000);
  }
}

function replyTo(favoriter, target) {

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
  b64 = fs.readFileSync(filename, imgParams);
  T.post('media/upload', { media_data: b64 }, uploaded);
}

function uploaded(err, data, response) {
  console.log('Uploaded the image');
  uploadID = data.media_id_string;
  console.log('Upload ID is: ' + uploadID);
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
  if (!err) {
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
  } else {
    saveTwitterData(err);
  }
}

function getRandomBibleVerse() {
  request(bibleParams, requestHandler);
}

function requestHandler(error, response, body) {

  if (!error && response.statusCode === 200) {
    var verseObject = body[0];
    var verseBook = verseObject.bookname;
    var verseChapter = verseObject.chapter;
    var verseVerse = verseObject.verse;
    var verseText = verseObject.text;
    var versePosition = verseBook + " " + verseChapter + ":" + verseVerse;
    verse = versePosition + " // " + verseText + " " + topHash;
    tweet = {
      status: verse,
      media_ids: uploadID
    }
    T.post('statuses/update', tweet, tweeted);
  } else {
    console.log(error);
  }
}

function tweeted(err, data, response) {
  if (err) {
    console.log('Something went wrong: ' + err);
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
function testArrayLength(array, limit) { //small function to test an array of strings for a char limit (e.g. Twitter's 280)
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
  fs.writeFile(filename, content, 'utf8', function (err) {
    if (err) {
      console.log(err)
    } else {
      console.log('Warning: Please reivew the log file: ' + filename);
    }
  });
}
