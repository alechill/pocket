/*jshint node:true */

/* A test application */

var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    webroot = __dirname + '/..';

console.log(webroot);
app.listen(8080);

function decorate(decorator, content, callBack) {
  var contentPath = webroot + (/^\//.test(content) ? '' : '/') + content,
      decoratorPath = webroot + (/^\//.test(decorator) ? '' : '/') + decorator;
  callBack = callBack || function(err, data){};
  console.log();
  console.log('decorate:');
  console.info(content);
  console.info(' ==> ' + contentPath);
  console.log('with:');
  console.log(decorator);
  console.info(' ==> ' + decoratorPath);
  fs.readFile(decoratorPath, 'utf-8', function (decoratorErr, decoratorData) {
    if (decoratorErr) {
      console.error('Could not find decorator: ' + decoratorPath);
      return callBack(decoratorErr);
    }
    fs.readFile(contentPath, 'utf-8', function (contentErr, contentData) {
      if (contentErr) {
        console.error('Could not find content: ' + contentPath);
        return callBack(contentErr);
      }
      callBack(null, decoratorData.replace('{{decorated_content}}', contentData));
    });
  });
}

function handler (req, res) {
  var url = (req.url === '/') ? 'fixtures/index.html' : req.url,
      path;

  function callBack(err, data) {
    if (err) {
      console.error(err);
      res.writeHead(500);
      return res.end('Error loading ' + req.url);
    }
    res.writeHead(200);
    res.end(data);
  }

  if (/favicon\.ico$/.test(url)) return;

  console.log();
  console.log('handler:');
  console.log(req.url);
  console.log(' ==> ' + url);
  if (/\.html$/.test(url)) {
    console.log('will decorate...');
    decorate('fixtures/layout.html', url, callBack);
  }
  else {
    path = webroot + (/^\//.test(url) ? '' : '/') + url;
    console.log(' ==> ' + path);
    console.log('will not decorate...');
    fs.readFile(path, callBack);
  }
}


io.sockets.on('connection', function (socket) {
  socket.on('pio', function (url) {
    var path = webroot + (/^\//.test(url) ? '' : '/') + url;
    console.log();
    console.log('pio requested ' + url);
    console.info(' ==> ' + path);
    fs.readFile(path, 'utf-8',
    function (err, data) {
      if (err) {
        return socket.emit('Error requesting ' + url);
      }
      socket.emit('pio', data);
    });
  });
});
