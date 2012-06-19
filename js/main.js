
require.config({
  baseUrl: "/js"
});

// @TODO - socket.io is in CommonJS format, wrap in AMD manually until can get it working with require.js
define('socket.io', function(){
  return io;
});

// bootstrap
require(['pocket'], function(Pocket) {
  var p = new Pocket('http://localhost:8080');
  p.beforeReplace = function(targetEl, data) {
    if( window.console ) window.console.log('before replace', targetEl, data);
  };
  p.afterReplace = function(targetEl, data) {
    if( window.console ) window.console.log('after replace', targetEl, data);
  };
  window.skyRocket = p;
});
