var { sprintf } = require('sprintf-js');

var columnSpec = function (width) {
  return function (str) {
    str = '' + str;
    return str + ' '.repeat(Math.max(0, width - str.length));
  };
}

var rowSpec = function (cols, seperator = '') {
  return function (data) {
    return data.map((v, i) => cols[i](v)).join(seperator);
  };
}

var safeFunction = function (body) {
  var _global = this;
  return function () {
    var mask = { source: undefined };
    for (p in _global)
      mask[p] = undefined;
    return new Function(`with(this) { ${body} }`).call(Object.assign(mask, this));
  }
}

var compileOutputPattern = function (pattern) {
  var c = 0
    , f = []
  pattern = pattern.replace(/(%\()#((?:[^)]|\\.)+)((?<=[^\\])\)[bcdeufosxX])/g, function (__, a1, _expr, a2) {
    var name = `__var${c++}`
      , expr = _expr.replace(/\\(.)/g, (_, a) => a);
    f.push({
      name, f: safeFunction(`return ${expr}`)
    });
    return a1 + name + a2;
  });
  return function (args) {
    var vals = f.reduce((obj, { name, f }) => {
      obj[name] = f.call(args);
      return obj;
    }, {});
    return sprintf(pattern, {
      ...args,
      ...vals
    });
  }
};

module.exports = { columnSpec, rowSpec, compileOutputPattern };
