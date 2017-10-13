console.log('The bot is starting...');

var Twit = require('twit');
var config = require('./config');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var T = new Twit(config);

var sParams = {
  q: 'eleven',
  geocode: '30.2672 97.7431 100mi',
  count: 10
}

//T.get('search/tweets', sParams, gotSearch);

function gotSearch(err, data, response) {
  var tweets = data.statuses;
  for (var i = 0; i < tweets.length; i++) {
    console.log(tweets[i].text);
  }
}

var topTrend;
var topHash;
var tCleanedArray = [];
var tParams = {
  id: '23424977' //united states WOE ID
  //woeid lookup http://woeid.rosselliot.co.nz/lookup/united%20states
}

T.get('trends/place', tParams, gotTrends);

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
  console.log(topHash);
  // console.log(topTrend.volume);
}


var tweet = {
  status: verse
}

//T.post('statuses/update', tweet, tweeted);

function tweeted(err, data, response) {
  if (err) {
    console.log('Something went wrong: ' + err);
  } else {
    console.log('It worked!');
  }
  //console.log(response);
}

//beginning of bible verse code
var request = require("request")

var verse;
var url = "https://labs.bible.org/api/?" +
  "passage=random" +
  "&type=json";

var requestParams = {
  url: url,
  json: true
}

//request(requestParams, requestHandler)

function requestHandler(error, response, body) {

  if (!error && response.statusCode === 200) {
    var verseObject = body[0];
    console.log(verseObject) // Print the object of json response
    var verseBook = verseObject.bookname;
    var verseChapter = verseObject.chapter;
    var verseVerse = verseObject.verse;
    var verseText = verseObject.text;
    var versePosition = verseBook + " " + verseChapter + ":" + verseVerse;
    verse = versePosition + " // " + verseText;
    var tweet = { status: verse }
    T.post('statuses/update', tweet, tweeted);
  }
}
