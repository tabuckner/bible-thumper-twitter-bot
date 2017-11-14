var Twit = require('twit');
var config = require('./config');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs');
var download = require('download');
var fs = require('fs');
var path = require('path');
var request = require("request");
var rp = require("request-promise-native");
// var WordPOS = require('wordpos'),
//   wordpos = new WordPOS();
const replyOptions = require('./replies.js');
const deflectionOptions = require('./deflection.js');

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

//Global Vars for getting/downloading image
var filename = 'img/1080.jpg';
var imgParams = {
  encoding: 'base64',
}
var b64;
var uploadID;
var bibleParams = {
  url: bibleURL,
  json: true
}
var bibleURL = "https://labs.bible.org/api/?" +
  "passage=random" +
  "&type=json";

//Global Vars for DM responses
var dmResponsesAry = [];
var dmTypingTime = 45000;
var dmURL = "https://talaikis.com/api/quotes";
var usersMessage;
var dmPullCounter = 0;
var dmPullIterations = 5;
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

// var testMsg = "Are you a real account or just a bot?";
var testUsr = {
  screen_name: 'titsMcGee',
  id_str: '6969',
  text: 'Are you a real account or just a bot?'
}
var testMsg = "sports,religion,knowledge,alone,cool,sad,change,war,government,home,war,design,amazing,politics,religion,dad,parenting,science,food,food,power,home,movies,art,design,family,famous,best,teen,freedom,alone,love,war,great,family,dad,change,home,leadership,power,men,relationship,art,money,society,legal,money,famous,courage,learning,success,equality,work,strength,society,marriage,famous,finance,experience,travel,education,leadership,freedom,sports,future,communication,education,home,change,home,marriage,graduation,women,education,money,alone,respect,women,health,friendship,nature,leadership,famous,environmental,time,love,men,nature,men,experience,famous,trust,success,teacher,love,food,attitude,medical,success,money";
// wordpos.getPOS(testMsg, function(result) {
//   console.log(result);
// });


// createDMResponse(/* 'titties', '6969', testMsg,  */testUsr);
sendDMReply(testUsr, 'Tits and ass bro.');
/* setTimeout(function () {
  createDMResponse('titties', '6969', 'Testing out the functionality');
}, (1.5 * 60 * 1000));  */
// getDMResponses();
// stream.on('direct_message', dmHandler);
// stream.on('follow', followHandler);
// stream.on('favorite', gotAFavorite);
// downloadImage();
// setInterval(downloadImage, randomTweetInterval);


/* FUNCTION SECTION
DIRECT MESSAGE
*/

function dmHandler(messageObj) {
  // saveTwitterData('dm.json', message);
  var screen_name = messageObj.direct_message.sender.screen_name;
  var id_str = messageObj.direct_message.sender.id_str;
  var message = messageObj.direct_message.text;
  var dmUser = {
    screen_name: screen_name,
    id_str: id_str,
    text: message
  }
  // console.log('dmHandler: ' + JSON.stringify(dmUser))

  console.log('Received a DM!');
  console.log('User @' + dmUser.screen_name + " (" + dmUser.id_str + "): " + dmUser.text);
  createDMResponse(screen_name, id_str, message, dmUser);
}

function createDMResponse(/* user, id, message,  */dmUser) {
  // console.log('createDMResponse: ' + JSON.stringify(dmUser))

  // usersMessage = message.toLowerCase(); //needed to pass the users message around cause i suck at clean code.
  if (dmUser.screen_name !== myScreenName) {  //if the dmResponse array is empty.
    if (dmResponsesAry.length === 0) {
      console.log('DM Response Array is empty. Pulling a new list.');
      getDMResponses(dmUser/* , message */);
    } else {  //if we already have some choices we can check
      console.log('DM Response Array has values. Using current set.');
      findPromiseResponse(/* dmUser,  */message);
    }
    //see if the any of the words in their message matches the content of any element in the current random dm response array  
    //if not check each elements category
    //if not, redfine the array
  }
}

function getDMResponses(dmUser/* , message */) {
  var message = dmUser.text;
  console.log(message);
  console.log('getDMResponses Pull #' + (dmPullCounter + 1));
  // request(dmURL, gotDMResponses);
  rp(dmURL)
    .then(function (data) {
      data = JSON.parse(data);
      findPromiseResponse(data, dmUser);
    })
    .catch(function (err) {
      console.log('getDMResponses threw` an error:');
      console.log(err.name);
      console.log(err.statusCode);
      console.log(err);
    });
  dmPullCounter++
}

/* function gotDMResponses(err, res, data) {
  if (!err && res.statusCode === 200) {
    var data = JSON.parse(data);
    dmResponses = data;

    findDMResponse(usersMessage)
  } else if (!err) {
    console.log('Status Code: ' + res.statusCode);
    console.log(res.body);
  } else {
    console.log('Status Code: ' + res.statusCode);
    console.log(res.body);
  }
} */

function findPromiseResponse (data, dmUser) {
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
    // console.log('Categories Attempted: ' + noMatchSet); //good for testing, but clutters shit up
    console.log('===================');
    if (dmPullCounter < dmPullIterations) { // if we havent reached our iteration cap
      getDMResponses(dmUser); //take a look at this
    } else {
      deflectOrContinue(dmUser);
    }
  } else { // if we did find some matches
    var selector = Math.floor(Math.random() * matchSet.length);
    var reply = matchSet[selector].quote;
    console.log(reply); //logs out the selected response
    sendDMReply(dmUser, reply);

  }

}

function deflectOrContinue(dmUser) { // 1/3 chance to either deflect, try again, or do nothing
  // console.log('The User details we need are ' + JSON.stringify(dmUser));
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
  } else { // 2/3 and 1
    //do nothing
    console.log('*****Terminating the DM Response Without a Reply*****');
  }
}

function sendDMReply(dmUserObj, reply) {
  var dmParams = {
    screen_name: dmUserObj.screen_name,
    user_id: dmUserObj.user_id,
    text: reply
  }
  T.post('direct_messages', dmParams, sentDMReply);
}

function sentDMReply(err, res, data) {
  console.log(res);

}

/* function findDMResponse(data, message, dmUser) {
  dmResponses = data;
  // console.log('findDMResponse: ' + JSON.stringify(dmUser))
  var noMatchSet = [];
  var matchSet = [];

  for (i = 0; i < dmResponses.length; i++) {
    var thisCategory = dmResponses[i].cat;
    var thisQuote = dmResponses[i].quote;
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
    // console.log('Categories Attempted: ' + noMatchSet); //good for testing, but clutters shit up
    console.log('===================');
    if (dmPullCounter < dmPullIterations) { // if we havent reached our iteration cap
      getDMResponses(message);
    } else {
      deflectOrContinue(message);
    }
  } else { // if we did find some matches
    // console.log('Matches found: ' + JSON.stringify(matchSet));
    var selector = Math.floor(Math.random() * matchSet.length);
    var deflection = matchSet[selector].quote;
    // console.log(deflection);
    sendDMReply(dmuser, reply);

  }

}
 */

/* END FUNCTION SECTION
DIRECT MESSAGE
*/


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
  request(bibleParams, requestHandler);
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
  fs.writeFile(filename, content, 'utf8', function (err) {
    if (err) {
      console.log(err)
    } else {
      console.log('Warning: Please reivew the log file: ' + filename);
    }
  });
}
