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

module.exports = { columnSpec, rowSpec };
