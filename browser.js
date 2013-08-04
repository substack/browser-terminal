var hypernal = require('hypernal');
var term = hypernal();
term.appendTo('#terminal');
var through = require('through');

var bashful = require('bashful');
var sh = bashful({
    env: {
        USER: 'guest',
        PS1: '\\u $ ',
        UID: 1000
    },
    spawn: function (cmd, args, opts) {
        var tr = through();
        tr.pause();
        process.nextTick(function () { tr.resume() });
        tr.queue('...\n');
        tr.queue(null);
        
        return tr;
    },
    write: function () {},
    read: function () {},
    exists: function () { return false }
});

var stream = sh.createStream();
stream.pipe(term);

var terminal = document.querySelector('#terminal');
stream.on('data', function () {
    terminal.scrollTop = terminal.scrollHeight;
});

window.addEventListener('keydown', function (ev) {
    var c = String.fromCharCode(ev.keyCode);
    if (/[A-Z]/.test(c) && ev.shiftKey === false) {
        c = c.toLowerCase();
    }
    if (c === '\r') c = '\n';
    term.write(c)
    stream.write(c);
});
