var hypernal = require('hypernal');
var term = hypernal();
term.appendTo('#terminal');
var through = require('through');
var spawn = require('./lib/spawn.js');

var bashful = require('bashful');
var sh = bashful({
    env: {
        USER: 'guest',
        PS1: '\\[\033[01;32m\\]\\u\\[\033[00m\\] : '
            + '\\[\033[01;34m\\]\\W\\[\033[00m\\] $ ',
        HOME: '/home/guest',
        PWD: '/home/guest',
        UID: 1000
    },
    spawn: function (cmd, args, opts) {
        return spawn(cmd, args, opts);
    },
    write: function () {},
    read: function () {},
    exists: function () { return false }
});

var stream = sh.createStream();
stream.pipe(term);

var terminal = document.querySelector('#terminal');
stream.on('data', scrollBottom);

var termStyle;
function scrollBottom () {
    if (!termStyle) termStyle = window.getComputedStyle(terminal);
    if (terminal.scrollHeight > parseInt(termStyle.height)) {
        terminal.scrollTop = terminal.scrollHeight;
    }
}

window.addEventListener('keydown', function (ev) {
    var c = String.fromCharCode(ev.keyCode);
    if (/[A-Z]/.test(c) && ev.shiftKey === false) {
        c = c.toLowerCase();
    }
    
    if (c === 'c' && ev.ctrlKey) {
        stream.write('\003');
    }
    else if (c === 'd' && ev.ctrlKey) {
        stream.write('\004');
    }
    else if ((c === 'h' && ev.ctrlKey) || ev.keyCode === 8) {
        term.write('\010 \010');
        stream.write('\010');
    }
    else {
        if (c === '\r') c = '\n';
        term.write(c)
        stream.write(c);
    }
    scrollBottom();
});
