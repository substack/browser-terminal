var through = require('through');
var bashful = require('bashful');
var hypernal = require('hypernal');
var charSizer = require('char-size');
var spawn = require('./lib/spawn.js');

var terminal = document.querySelector('#terminal');
terminal.style.overflow = 'hidden';

var term = hypernal();
term.term.convertEol = true;
term.appendTo(terminal);

var charSize = charSizer(terminal);

var cursor = document.createElement('div');
cursor.classList.add('cursor');
terminal.appendChild(cursor);

setInterval(function () {
    cursor.classList.toggle('on');
}, 1000);

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
    exists: function (file, cb) {
        cb(file === '/' || file === '/home' || file === '/home/guest');
    }
});

var stream = sh.createStream();
stream.pipe(term);
stream.on('data', reposition);

var termStyle;
function reposition () {
    if (!termStyle) termStyle = window.getComputedStyle(terminal);
    if (terminal.scrollHeight > parseInt(termStyle.height)) {
        terminal.scrollTop = terminal.scrollHeight;
    }
    
    var lineDiv = term.term.element.childNodes[term.term.y];
    cursor.style.top = parseInt(lineDiv.offsetTop)
        + parseInt(termStyle.paddingTop)
        + 2
    ;
    cursor.style.left = (
        charSize.width * term.term.x + parseInt(termStyle.paddingLeft)
    ) + 'px';
}

window.addEventListener('keydown', function (ev) {
    var c = String.fromCharCode(ev.keyCode);
    if (/[A-Z]/.test(c) && ev.shiftKey === false) {
        c = c.toLowerCase();
    }
    else if (/\d/.test(c) && ev.shiftKey) {
        c = ')!@#$%^&*('.charAt(parseInt(c));
    }
    else {
        c = {
            191: '/',
            s_191: '?',
            192: '`',
            s_192: '~',
            189: '-',
            s_189: '_',
            187: '=',
            s_187: '+',
            219: '[',
            s_219: '{',
            221: ']',
            s_221: '}',
            220: '\\',
            s_220: '|',
            186: ';',
            s_186: ':',
            222: '\'',
            s_222: '"',
            188: ',',
            s_188: '<',
            190: '.',
            s_190: '>'
        }[(ev.shiftKey ? 's_' : '') + ev.keyCode] || c;
    }
    
    if (c === 'c' && ev.ctrlKey) {
        stream.write('\003');
    }
    else if (c === 'd' && ev.ctrlKey) {
        stream.write('\004');
    }
    else if ((c === 'h' && ev.ctrlKey) || ev.keyCode === 8) {
        stream.write('\010');
    }
    else {
        if (c === '\r') c = '\n';
        if (c === ' ') {
            term.write('');
            term.term.x ++;
        }
        else term.write(c)
        stream.write(c);
    }
    
    reposition();
});
