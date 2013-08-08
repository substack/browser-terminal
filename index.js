var through = require('through');
var hypernal = require('hypernal');
var charSizer = require('char-size');

module.exports = function () {
    var element = document.createElement('div');
    element.style.overflow = 'hidden';
    element.style.position = 'relative';
    
    var term = hypernal();
    term.term.convertEol = true;
    term.appendTo(element);
    
    var cursor = document.createElement('div');
    cursor.style.position = 'absolute';
    cursor.style.top = '0px';
    cursor.style.left = '0px';
    cursor.style.height = '1em';
    cursor.style.width = '1ex';
    cursor.style.color = 'transparent';
    
    element.appendChild(cursor);
    
    var stream = through(function (buf) {
        term.write(buf);
        stream._reposition();
    });
    stream._term = term;
    stream._cursor = cursor;
    stream.element = element;
    stream._reposition = reposition;
    stream.keydown = function (ev) { return keydown.call(stream, ev) };
    
    stream.appendTo = function (target) {
        if (typeof target === 'string') {
            target = document.querySelector(target);
        }
        target.appendChild(element);
        
        stream._charSize = charSizer(element);
        var ts = stream._termStyle = window.getComputedStyle(element);
        element.style.padding = '0px';
        
        var nodes = element.childNodes[0].childNodes;
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].style.whiteSpace = 'pre-wrap';
            nodes[i].style.wordBreak = 'break-word';
        }
        
        return stream;
    };
    
    stream._cursorMoved = (function () {
        var to;
        return function () {
            cursor.style.backgroundColor = 'white';
            cursor.style.color = 'black';
            
            if (to) clearTimeout(to);
            to = setTimeout(function f () {
                if (cursor.style.backgroundColor === 'white') {
                    cursor.style.backgroundColor = 'transparent';
                    cursor.style.color = 'transparent';
                }
                else {
                    cursor.style.backgroundColor = 'white';
                    cursor.style.color = 'black';
                }
                to = setTimeout(f, 600);
            }, 500);
        };
    })();
    
    return stream;
};

function reposition () {
    if (!this._termStyle) return;
    
    var nodes = this.element.childNodes[0].childNodes;
    var current = nodes[this._term.term.y];
    
    if (current.offsetTop > this._termStyle.height) {
        this.element.scrollTop = current.offsetTop;
    }
    
    var lineDiv = this._term.term.element.childNodes[this._term.term.y];
    this._cursor.style.top = parseInt(lineDiv.offsetTop)
        + parseInt(this._termStyle.paddingTop)
        + 2
    ;
    this._cursor.style.left = (
        this._charSize.width * this._term.term.x
        + parseInt(this._termStyle.paddingLeft)
    ) + 'px';
    this._cursor.textContent = current.textContent.charAt(this._term.term.x);
}

function keydown (ev) {
    if (typeof ev === 'number') ev = { which: ev };
    var code = ev.which || ev.keyCode;
    var c = String.fromCharCode(code);
    
    if (ev.shiftKey && ev.ctrlKey) return;
    if (ev.ctrlKey && c === 'R') return; // pass ctrl-r through
    if (ev.ctrlKey && c === 'L') return; // pass ctrl-l through

    ev.preventDefault();
    this._cursorMoved();
    
    if (code < 32 && code !== 8 && !/\s/.test(c)) return;
    
    if (code >= 37 && code <= 40) {
        c = '\x1b[' + String.fromCharCode({
            38: 65, 40: 66, 39: 67, 37: 68
        }[code]);
        this.queue(c);
        return;
    }
    else if (code === 33) return this.queue('\x1b[5~'); // pgup
    else if (code === 34) return this.queue('\x1b[6~'); // pgdown
    else if (code === 35) return this.queue('\x1bOF'); // end
    else if (code === 36) return this.queue('\x1bOH'); // home
    else if (code === 45) return this.queue('\x1b[2~'); // insert
    else if (code === 46) return this.queue('\x1b[3~'); // delete
    
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
        this.queue(c);
    }
    else {
        if (c === '\r') c = '\n';
        if (c === ' ') {
            this._term.term.x ++;
        }
        else this._term.write(c);
        this.queue(c);
    }
    
    this._reposition();
}
