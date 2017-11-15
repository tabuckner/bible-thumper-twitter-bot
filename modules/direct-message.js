var rp = require("request-promise-native");
const deflectionOptions = require('./static/deflection.js');

var dmResponsesAry = [];
var dmTypingTime = 45000;
var dmURL = "https://talaikis.com/api/quotes";
var usersMessage;
var dmPullCounter = 0;
var dmPullIterations = 5;

/* FUNCTION SECTION
DIRECT MESSAGE
*/

module.exports.dmHandler = function dmHandler(messageObj) {
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
}

/* END FUNCTION SECTION
DIRECT MESSAGE
*/