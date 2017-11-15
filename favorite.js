const replyOptions = require('./static/replies.js');

/* FUNCTION SECTION
FAVORITE ACTION
*/
module.exports.gotAFavorite = function gotAFavorite(eventMsg) {
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