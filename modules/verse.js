var download = require('download');
var fs = require('fs');
var request = require("request");

var filename = 'modules/static/img/1080.jpg';
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

var topTrend;
var topHash;
var tCleanedArray = [];
var tParams = {
  id: '23424977' //united states WOE ID
  //woeid lookup http://woeid.rosselliot.co.nz/lookup/united%20states
}
var tweet;
var verse;

/* FUNCTION SECTION
Random Bible Verse
 */
module.exports.downloadImage = function downloadImage() {
  download('https://picsum.photos/1920/1080?random', 'modules/static/img').then(() => {
    console.log('Downloaded a new image');
    uploadImage();
  });
}

function uploadImage() {
  b64 = fs.readFileSync(filename, imgParams);
  T.post('media/upload', { media_data: b64 }, uploaded);
}

function uploaded(err, data, response) {
  if (!err) {
    console.log('Uploaded the image');
    uploadID = data.media_id_string;
    console.log('Upload ID is: ' + uploadID);
    getTrendingTopics();
  } else {
    console.log(err);
  }
}

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
    console.log(err);
  }
}

function getRandomBibleVerse() {
  request(bibleParams, gotRandomBibleVerse);
}

function gotRandomBibleVerse(error, response, body) {

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
    T.post('statuses/update', tweet, tweetedBible);
  } else {
    console.log(error);
  }
}

function tweetedBible(err, data, response) {
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