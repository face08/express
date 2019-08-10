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
 */

var merge = require('utils-merge')
var parseUrl = require('parseurl');
var qs = require('qs');

/**
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function query(options) {
  // 准备参数
  var opts = merge({}, options)
  var queryparse = qs.parse;

  if (typeof options === 'function') {
    queryparse = options;
    opts = undefined;
  }

  if (opts !== undefined && opts.allowPrototypes === undefined) {
    // back-compat for qs module
    opts.allowPrototypes = true;
  }

  // 解析query：name=face 解析为{name:face}
  return function query(req, res, next){
    if (!req.query) {
      var val = parseUrl(req).query;
      req.query = queryparse(val, opts);
    }

    next();
  };
};
