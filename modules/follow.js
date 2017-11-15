/* FUNCTION SECTION
FOLLOW ACTION
*/

module.exports.followHandler = function followHandler(eventMsg) {
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
}

/* END FUNCTION SECTION
FOLLOW ACTION
*/

