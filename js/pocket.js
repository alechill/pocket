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

    beforeReplace: function(target, data) {},
    afterReplace: function(target, data) {},

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

    goTo: function(url, target, title, data) {
      var state;
      if (url && target) {
        state = {url: url, target: target, title: title, data: data || {}};
        if (this.hasHistory()) {
          window.history.pushState(state, title, url);
        }
        else {
          return;
        }
        this._changeState(state);
      }
    },

    _request: function(url, target, title, data) {
      var currentListener;
      if (this._targetListeners[target]) {
        this.socket.removeListener(this._targetListeners[target]);
        delete this._targetListeners[target];
      }
      // store the handler and
      this._targetListeners[target] = __bind(this, this._onContentRecieved, target, title, data || {});
      this.socket.once('pocket', this._targetListeners[target]);
      this.socket.emit('pocket', url);
    },

    _onPopState: function(e) {
      this._changeState(e.state);
    },

    _onClick: function(e) {
      var trigger = e.target,
          href = trigger.getAttribute('href'),
          data = {},
          title,
          target,
          prop;

      if (!href || /^#|[a-z]+\:\/\//.test(href)) return;

      if (trigger.dataset) {
        target = trigger.dataset.pocketTarget;
        title = trigger.dataset.pocketTitle || document.title;
        for (prop in trigger.dataset) {
          if (trigger.dataset.hasOwnProperty(prop)) {
            data[prop] = trigger.dataset[prop];
          }
        }
      }
      else {
        target = trigger.getAttribute('data-pocket-target');
        title = trigger.getAttribute('data-pocket-title') || document.title;
      }

      if (!target) return;

      e.preventDefault();
      this.goTo(href, target, title, data);
    },

    _onContentRecieved: function(target, title, data, content) {
      target = (typeof target === 'string') ? document.getElementById(target) : target;
      if (target) {
        // before callback - use this to tear down previous content related JS
        this.beforeReplace(target, data);
        target.innerHTML = content;
        // after callback - use this to perform new content related JS
        this.afterReplace(target, data);
        if (title) document.title = title;
      }
    },

    _changeState: function(state) {
      if (state) {
        this._request(state.url, state.target, state.title, state.data);
      }
    }

  };

  return Pocket;

});
