/*
Bookmarks-Chocmixin.
A mixin for Chocolat to run Applescript files and view their output.
https://github.com/franzheidl/run-applescript.chocmixin
Franz Heidl 2014
MIT License
*/

var spawn = require('child_process').spawn;
var output = [];
var maxOutputLength = 99;
var win;

function buffer(str) {
  str.body = '';
  str.setEncoding('utf8');
  str.on('data', function(chunk) {
    str.body += chunk;
  });
}

function runApplescript(scr, callback) {
  var run = spawn('osascript', ['-ss']);
  var result;
  buffer(run.stdout);
  buffer(run.stderr);
  run.on('exit', function(code) {
    if (code) {
      result = {errorMsg: run.stderr.body};
    }
    else {
      result = {result: run.stdout.body};
    }
    callback(result);
  });
  run.stdin.write(scr);
  run.stdin.end();
}

function updateWin() {
  win.applyFunction(function(data) {
    var log = document.getElementById('log');
    log.innerHTML = '';
    var line;
    for (var i = 0; i < data.length; i++) {
      line = document.createElement('p');
      if (data[i].hasOwnProperty('errorMsg')) {
        line.classList.add('error');
        line.textContent = data[i].errorMsg;
      } else if (data[i].hasOwnProperty('result')) {
        line.textContent = data[i].result;
      }
      log.appendChild(line);
    }
    var buttonBarHeight = 36;
    var viewport = window.pageYOffset + window.innerHeight - buttonBarHeight;
    var logBottom = log.getBoundingClientRect().height;
    if (logBottom > viewport) {
      window.scrollTo(0, (logBottom - buttonBarHeight));
    }
  }, [output]);
}

function showWin() {
  if(!win) {
    win = new Window();
    win.title = 'Applescript';
    win.buttons = ['Clear'];
    win.htmlPath = './html/run-applescript.html';
    win.onLoad = function() {
      updateWin();
    };
    win.onButtonClick = function(button) {
      if (button === 'Clear') {
        output = [];
        updateWin();
      }
    };
    win.onUnload = function() {
      win = undefined;
    };
    win.run();
  } else {
    win.show();
    updateWin();
  }
}


function run() {
  if (Document.current()) {
    if (Document.current().rootScope() === 'applescript.source') {
      
      var script = Document.current().text;
      
      runApplescript(script, function(res) {
        if (res) {
          if ((res.hasOwnProperty('errorMsg') && res.errorMsg !== '') || (res.hasOwnProperty('result') && res.result !== '')) { // ignore empty output of scripts not returning anything
            output.push(res);
            while(output.length > maxOutputLength) {
              output.splice(0, 1);
            }
            showWin();
          }
        }
      });
    }
    else {
      Alert.show('Run Applescript Error:', '\'' + Document.current().filename() + '\'' + ' does not appear to be Applescript.');
    }
  }
}

Hooks.addMenuItem( 'Actions/Applescript/Run Applescipt', 'alt-cmd-ctrl-r', function() {
  run();
});
