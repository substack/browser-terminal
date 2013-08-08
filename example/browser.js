var terminal = require('../');
var bashful = require('bashful');

var sh = bashful({
    env: {
        USER: 'guest',
        PS1: '\\[\\033[01;32m\\]\\u\\[\\033[00m\\] : '
            + '\\[\\033[01;34m\\]\\W\\[\\033[00m\\] $ ',
        HOME: '/home/guest',
        PWD: '/home/guest',
        UID: 1000
    },
    spawn: function () {},
    write: function () {},
    read: function () {},
    exists: function (file, cb) {
        cb(file === '/' || file === '/home' || file === '/home/guest');
    }
});
var term = terminal().appendTo('#terminal')
term.pipe(sh.createStream()).pipe(term);

window.addEventListener('keydown', term.keydown);
