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
    this._targetListeners = {};
    this.connectTo = connectTo;
    this.connect(this.connectTo);
  }

  Pocket.prototype = {

    socket: null,
    connectTo: null,

    _boundOnClick: null,
    _boundOnPopState: null,

    _targetListeners: null,

    beforeReplace: function(targetEl) {},
    afterReplace: function(targetEl) {},

    connect: function(connectTo){
      this.socket = io.connect(connectTo, {'force new connection': true});

      this._boundOnClick = __bind(this, this._onClick);
      document.body.addEventListener('click', this._boundOnClick);

      if (this.hasHistory()) {
        this._boundOnPopState = __bind(this, this._onPopState);
        window.addEventListener('popstate', this._boundOnPopState);
      }
      else {
        // @TODO - until hashchange and iframe fallbacks are inplemented - fallback to standard http
        return;
      }
    },

    disconnect: function(){
      this.socket.disconnect();

      document.body.removeEventListener('click', this._boundOnClick);
      delete this._boundOnClick;

      if (this.hasHistory()) {
        window.removeEventListener('popstate', this._boundOnPopState);
        delete this._boundOnPopState;
      }
      else {
        return;
      }
    },

    hasHistory: function() {
      return !!window.history;
    },

    goTo: function(url, pocketTarget, pocketTitle, data) {
      var state;
      if (url && pocketTarget) {
        state = {url: url, pocketTarget: pocketTarget, pocketTitle: pocketTitle, data: data || {}};
        if (this.hasHistory()) {
          window.history.pushState(state, pocketTitle, url);
        }
        else {
          return;
        }
        this._changeState(state);
      }
    },

    _request: function(url, pocketTarget, pocketTitle, data) {
      var currentListener;
      if (this._targetListeners[pocketTarget]) {
        this.socket.removeListener(this._targetListeners[pocketTarget]);
        delete this._targetListeners[pocketTarget];
      }
      // store the handler and
      this._targetListeners[pocketTarget] = __bind(this, this._onContentRecieved, pocketTarget, pocketTitle, data || {});
      this.socket.once('pocket', this._targetListeners[pocketTarget]);
      this.socket.emit('pocket', url);
    },

    _onPopState: function(e) {
      this._changeState(e.state);
    },

    _onClick: function(e) {
      var originator = e.target,
          href = originator.getAttribute('href'),
          pocketTitle,
          pocketTarget,
          data = {},
          prop;

      if (!href || /^#|[a-z]+\:\/\//.test(href)) return;

      if (originator.dataset) {
        pocketTarget = originator.dataset.pocketTarget;
        pocketTitle = originator.dataset.pocketTitle || document.title;
        for (prop in originator.dataset) {
          if (originator.dataset.hasOwnProperty(prop)) {
            data[prop] = originator.dataset[prop];
          }
        }
      }
      else {
        pocketTarget = originator.getAttribute('data-pocket-target');
        pocketTitle = originator.getAttribute('data-pocket-title') || document.title;
      }

      if (!pocketTarget) return;

      e.preventDefault();
      this.goTo(href, pocketTarget, pocketTitle, data);
    },

    _onContentRecieved: function(pocketTarget, pocketTitle, data, content) {
      var target = (typeof pocketTarget === 'string') ? document.getElementById(pocketTarget) : pocketTarget;
      if (target) {
        // before callback - use this to tear down previous content related JS
        this.beforeReplace(target, data);
        target.innerHTML = content;
        // after callback - use this to perform new content related JS
        this.afterReplace(target, data);
        if (pocketTitle) document.title = pocketTitle;
      }
    },

    _changeState: function(state) {
      if (state) {
        this._request(state.url, state.pocketTarget, state.pocketTitle, state.data);
      }
    }

  };

  return Pocket;

});
