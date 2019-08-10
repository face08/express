/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

var debug = require('debug')('express:router:route');
var flatten = require('array-flatten');
var Layer = require('./layer');
var methods = require('methods');

/**
 * Module variables.
 * @private
 */

var slice = Array.prototype.slice;
var toString = Object.prototype.toString;

/**
 * Module exports.
 * 存储路由回调堆栈，递归调用
 * @public
 */

module.exports = Route;

/**
 * 初始化
 * Initialize `Route` with the given `path`,
 *
 * @param {String} path
 * @public
 */

function Route(path) {
  this.path = path;
  this.stack = []; // [Layer ... ] 堆栈函数

  debug('new %o', path)

  // route handlers for various http methods
  this.methods = {}; // {get:true ... }
}

/**
 * 判断是否有指定的方法 method
 * Determine if the route handles a given method.
 * @private
 */

Route.prototype._handles_method = function _handles_method(method) {
  // 特殊判断 all
  if (this.methods._all) {
    return true;
  }

  var name = method.toLowerCase();
  if (name === 'head' && !this.methods['head']) {
    name = 'get';
  }

  return Boolean(this.methods[name]);
};

/**
 * 支持的 methods 大写
 * @return {Array} supported HTTP methods
 * @private
 */

Route.prototype._options = function _options() {
  var methods = Object.keys(this.methods);

  // append automatic head
  if (this.methods.get && !this.methods.head) {
    methods.push('head');
  }

  for (var i = 0; i < methods.length; i++) {
    // make upper case
    methods[i] = methods[i].toUpperCase();
  }

  return methods;
};

/**
 * dispatch req, res into this route
 * @private
 */

Route.prototype.dispatch = function dispatch(req, res, done) {
  var idx = 0;
  var stack = this.stack;
  if (stack.length === 0) {
    return done();
  }

  // 转义head，转小写
  var method = req.method.toLowerCase();
  if (method === 'head' && !this.methods['head']) {
    method = 'get';
  }

  req.route = this;

  next();

  // 递归调用
  function next(err) {
    // route：signal to exit route
    if (err && err === 'route') {
      return done();
    }

    // router： signal to exit router
    if (err && err === 'router') {
      return done(err)
    }

    // 最后一个递归结束
    var layer = stack[idx++];
    if (!layer) {
      return done(err);
    }

    // 函数不相等，下一个
    if (layer.method && layer.method !== method) {
      return next(err);
    }

    if (err) {
      layer.handle_error(err, req, res, next);
    } else {
      // 正常处理
      layer.handle_request(req, res, next);
    }
  }
};

/**
 * 所有请求处理函数
 * Add a handler for all HTTP verbs to this route.
 *
 * Behaves just like middleware and can respond or call `next`
 * to continue processing.
 *
 * You can use multiple `.all` call to add multiple handlers.
 *
 *   function check_something(req, res, next){
 *     next();
 *   };
 *
 *   function validate_user(req, res, next){
 *     next();
 *   };
 *
 *   route
 *   .all(validate_user)
 *   .all(check_something)
 *   .get(function(req, res, next){
 *     res.send('hello world');
 *   });
 *
 * @param {function} handler
 * @return {Route} for chaining
 * @api public
 */

Route.prototype.all = function all() {
  var handles = flatten(slice.call(arguments));

  for (var i = 0; i < handles.length; i++) {
    var handle = handles[i];

    if (typeof handle !== 'function') {
      var type = toString.call(handle);
      var msg = 'Route.all() requires a callback function but got a ' + type
      throw new TypeError(msg);
    }

    // 添加layer
    var layer = Layer('/', {}, handle);
    layer.method = undefined;

    this.methods._all = true;
    this.stack.push(layer);
  }

  return this;
};

// todo 所有http方法字符串  app.get、post 会触发这里
methods.forEach(function(method){
  Route.prototype[method] = function(){
    var handles = flatten(slice.call(arguments));

    // 多个函数，生成多个layer
    for (var i = 0; i < handles.length; i++) {
      var handle = handles[i];

      if (typeof handle !== 'function') {
        var type = toString.call(handle);
        var msg = 'Route.' + method + '() requires a callback function but got a ' + type
        throw new Error(msg);
      }

      debug('%s %o', method, this.path)

      // 添加layer 和 all 函数类似
      var layer = Layer('/', {}, handle);
      layer.method = method;

      this.methods[method] = true;
      this.stack.push(layer);
    }

    return this;
  };
});
