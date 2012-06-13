/*jshint browser:true */
define(['socket.io'], function(io) {

  "use strict";

  function __bind(scope, fn) {
    var args = Array.prototype.slice.call(arguments, 2);
    return function() {
      fn.apply(scope, args.concat(Array.prototype.slice.call(arguments)) );
    };
  }

  function Pio(connectTo) {
    this.init(connectTo);
  }

  Pio.prototype = {

    socket: null,

    init: function(connectTo){
      this.socket = io.connect(connectTo);

      document.body.addEventListener('click', __bind(this, this._onClick));

      if (this.hasHistory()) {
        window.addEventListener('popstate', __bind(this, this._onPopState));
      }
      else {
        // @TODO - until hashchange and iframe fallbacks are inplemented - fallback to standard http
        return;
      }
    },

    hasHistory: function() {
      return !!window.history;
    },

    goTo: function(url, pioTarget, pioTitle) {
      var state;
      if (url && pioTarget) {
        state = {url: url, pioTarget: pioTarget, pioTitle: pioTitle};
        if (this.hasHistory()) {
          window.history.pushState(state, pioTitle, url);
        }
        else {

        }
        this._changeState(state);
      }
    },

    _request: function(url, pioTarget, pioTitle) {
      this.socket.on('pio', __bind(this, this._onContentRecieved, pioTarget, pioTitle));
      this.socket.emit('pio', url);
    },

    _onPopState: function(e) {
      this._changeState(e.state);
    },

    _onClick: function(e) {
      var originator = e.target,
          href = originator.getAttribute('href'),
          pioTitle,
          pioTarget;

      if (!href || /^[a-z]+\:\/\//.test(href) || /^#/.test(href)) return;

      if (originator.dataset && originator.dataset.pioTarget) {
        pioTarget = originator.dataset.pioTarget;
      }
      else {
        pioTarget = originator.getAttribute('data-pio-target');
      }

      if (originator.dataset) {
        pioTarget = originator.dataset.pioTarget;
        pioTitle = originator.dataset.pioTitle || document.title;
      }
      else {
        pioTarget = originator.getAttribute('data-pio-target');
        pioTitle = originator.getAttribute('data-pio-title') || document.title;
      }

      if (!pioTarget) return;

      e.preventDefault();
      this.goTo(href, pioTarget, pioTitle);
    },

    _onContentRecieved: function(pioTarget, pioTitle, content) {
      var target = (typeof pioTarget === 'string') ? document.getElementById(pioTarget) : pioTarget;
      if (target) {
        // @TODO - before callback - used to tear down previous content related JS
        target.innerHTML = content;
        // @TODO - after callback - used to perform new content related JS
        if (pioTitle) document.title = pioTitle;
      }
    },

    _changeState: function(state) {
      if (state) {
        this._request(state.url, state.pioTarget, state.pioTitle);
      }
    }

  };

  return Pio;

});
