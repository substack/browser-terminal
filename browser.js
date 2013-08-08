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

var cursorMoved = (function () {
    var to;
    return function () {
        cursor.classList.add('on');
        if (to) clearTimeout(to);
        to = setTimeout(function f () {
            cursor.classList.toggle('on');
            to = setTimeout(f, 600);
        }, 500);
    };
})();

var sh = bashful({
    env: {
        USER: 'guest',
        PS1: '\\[\\033[01;32m\\]\\u\\[\\033[00m\\] : '
            + '\\[\\033[01;34m\\]\\W\\[\\033[00m\\] $ ',
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
    var nodes = terminal.childNodes[0].childNodes;
    var current = nodes[term.term.y];
    
    if (current.offsetTop > termStyle.height) {
        terminal.scrollTop = current.offsetTop;
    }
    
    var lineDiv = term.term.element.childNodes[term.term.y];
    cursor.style.top = parseInt(lineDiv.offsetTop)
        + parseInt(termStyle.paddingTop)
        + 2
    ;
    cursor.style.left = (
        charSize.width * term.term.x + parseInt(termStyle.paddingLeft)
    ) + 'px';
    cursor.textContent = current.textContent.charAt(term.term.x);
}

window.addEventListener('keydown', function (ev) {
    var code = ev.which || ev.keyCode;
    var c = String.fromCharCode(code);
    if (ev.shiftKey && ev.ctrlKey) return;
    if (ev.ctrlKey && c === 'R') return; // pass refresh through
    if (ev.ctrlKey && c === 'L') return; // pass ctrl-l through
    
    ev.preventDefault();
    cursorMoved();
    
    if (code < 32 && code !== 8 && !/\s/.test(c)) return;
    
    if (code >= 37 && code <= 40) {
        c = '\x1b[' + String.fromCharCode({
            38: 65, 40: 66, 39: 67, 37: 68
        }[code]);
        stream.write(c);
        return;
    }
    else if (code === 33) return stream.write('\x1b[5~'); // pgup
    else if (code === 34) return stream.write('\x1b[6~'); // pgdown
    else if (code === 35) return stream.write('\x1bOF'); // end
    else if (code === 36) return stream.write('\x1bOH'); // home
    else if (code === 45) return stream.write('\x1b[2~'); // insert
    else if (code === 46) return stream.write('\x1b[3~'); // delete
    
    if (/[A-Z]/.test(c) && ev.shiftKey === false) {
        c = c.toLowerCase();
    }
    else if (/\d/.test(c) && ev.shiftKey) {
        c = ')!@#$%^&*('.charAt(parseInt(c));
    }
    else {
        c = ({
            186: [ ';', ':' ],
            187: [ '=', '+' ],
            188: [ ',', '<' ],
            189: [ '-', '_' ],
            190: [ '.', '>' ],
            191: [ '/', '?' ],
            192: [ '`', '~' ],
            219: [ '[', '{' ],
            220: [ '\\', '|' ],
            221: [ ']','}' ],
            222: [ '\'', '"' ]
        }[code] || [ c, c ])[ev.shiftKey ? 1 : 0] || c;
    }
    
    if (/^[a-z]$/.test(c) && ev.ctrlKey) {
        code = code - 64;
        c = String.fromCharCode(code);
    }
    if (code === 7 || code === 8) {
        stream.write(c);
    }
    else {
        if (c === '\r') c = '\n';
        if (c === ' ') {
            term.term.x ++;
        }
        else term.write(c);
        stream.write(c);
    }
    
    reposition();
});
