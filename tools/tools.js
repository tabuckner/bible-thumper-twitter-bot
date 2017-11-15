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
