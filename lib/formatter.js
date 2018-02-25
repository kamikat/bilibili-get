var { mapValues } = require('lodash');
var { sprintf } = require('sprintf-js');
var sanitize = require('sanitize-filename');

var debug = require('debug').debug('bilibili:i:formatter');

var columnSpec = function (width) {
  return function (str) {
    str = '' + str;
    return str + ' '.repeat(Math.max(0, width - str.length));
  };
};

var rowSpec = function (cols, seperator = '') {
  return function (data) {
    return data.map((v, i) => cols[i](v)).join(seperator);
  };
};

var safeFunction = function (body) {
  var _global = this;
  return function () {
    var mask = { source: undefined };
    for (var p in _global)
      mask[p] = undefined;
    return new Function(`with(this) { ${body} }`).call(Object.assign(mask, this));
  };
};

var compileOutputPattern = function (pattern) {
  debug(`compiling pattern: ${pattern}`);
  var c = 0
    , f = [];
  pattern = pattern.replace(/(%\()#((?:[^)]|\\.)+[^\\])(\)[bcdeufosxX])/g, function (__, a1, _expr, a2) {
    var name = `__expr${c++}`
      , expr = _expr.replace(/\\(.)/g, (_, a) => a);
    debug(`variable: ${name}, expr: "${expr}"`);
    f.push({
      name, f: safeFunction(`return ${expr}`)
    });
    return a1 + name + a2;
  });
  debug('compiling pattern: success.');
  debug(`  pattern ${pattern}`);
  debug(`          with ${f.length} active expressions.`);
  return function (args) {
    return sprintf(pattern, {
      ...mapValues(args, (v) => typeof v == 'string' ? sanitize(v) : v),
      ...f.reduce((obj, { name, f }) => {
        obj[name] = f.call(args);
        return obj;
      }, {})
    });
  };
};

module.exports = { columnSpec, rowSpec, compileOutputPattern };
