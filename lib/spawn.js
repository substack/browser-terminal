var through = require('through');
var resumer = require('resumer');

exports = module.exports = function (cmd, args, opts) {
    if ({}.hasOwnProperty.call(exports, cmd)) {
        return exports[cmd](args, opts);
    }
};

exports.ls = function (args, opts) {
    var tr = resumer();
    tr.queue(JSON.stringify(opts) + '\n');
    return tr;
};
