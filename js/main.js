/*jshint */

require.config({
  baseUrl: "/js"
});

// @TODO - socket.io is in CommonJS format, wrap in AMD manually until can get it working with require.js
define('socket.io', function(){
  return io;
});

// bootstrap
require(['pocket'], function(Pocket) {
  window.pocket = new Pocket('http://localhost:8080');
});
