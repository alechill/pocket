/*jshint browser:true */
define(['socket.io'], function(io) {

  "use strict";

  function __bind(scope, fn) {
    var args = Array.prototype.slice.call(arguments, 2);
    return function() {
      fn.apply(scope, args.concat(Array.prototype.slice.call(arguments)) );
    };
  }

  function Pocket(connectTo) {
    this.targetListeners = {};
    this.init(connectTo);
  }

  Pocket.prototype = {

    socket: null,
    targetListeners: null,

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

    goTo: function(url, pocketTarget, pocketTitle) {
      var state;
      if (url && pocketTarget) {
        state = {url: url, pocketTarget: pocketTarget, pocketTitle: pocketTitle};
        if (this.hasHistory()) {
          window.history.pushState(state, pocketTitle, url);
        }
        else {

        }
        this._changeState(state);
      }
    },

    _request: function(url, pocketTarget, pocketTitle) {
      var currentListener;
      if (this.targetListeners[pocketTarget]) {
        this.socket.removeListener(this.targetListeners[pocketTarget]);
        delete this.targetListeners[pocketTarget];
      }
      // store the handler and
      this.targetListeners[pocketTarget] = __bind(this, this._onContentRecieved, pocketTarget, pocketTitle);
      this.socket.once('pocket', this.targetListeners[pocketTarget]);
      this.socket.emit('pocket', url);
    },

    _onPopState: function(e) {
      this._changeState(e.state);
    },

    _onClick: function(e) {
      var originator = e.target,
          href = originator.getAttribute('href'),
          pocketTitle,
          pocketTarget;

      if (!href || /^#|[a-z]+\:\/\//.test(href)) return;

      if (originator.dataset) {
        pocketTarget = originator.dataset.pocketTarget;
        pocketTitle = originator.dataset.pocketTitle || document.title;
      }
      else {
        pocketTarget = originator.getAttribute('data-pocket-target');
        pocketTitle = originator.getAttribute('data-pocket-title') || document.title;
      }

      if (!pocketTarget) return;

      e.preventDefault();
      this.goTo(href, pocketTarget, pocketTitle);
    },

    _onContentRecieved: function(pocketTarget, pocketTitle, content) {
      var target = (typeof pocketTarget === 'string') ? document.getElementById(pocketTarget) : pocketTarget;
      if (target) {
        // @TODO - before callback - used to tear down previous content related JS
        target.innerHTML = content;
        // @TODO - after callback - used to perform new content related JS
        if (pocketTitle) document.title = pocketTitle;
      }
    },

    _changeState: function(state) {
      if (state) {
        this._request(state.url, state.pocketTarget, state.pocketTitle);
      }
    }

  };

  return Pocket;

});
