# browser-terminal

pipe a shell into an interactive browser terminal

# example

``` js
var terminal = require('browser-terminal');
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
    exists: function (file, cb) {
        cb(file === '/' || file === '/home' || file === '/home/guest');
    }
});
var term = terminal().appendTo('#terminal')
term.pipe(sh.createStream()).pipe(term);

window.addEventListener('keydown', term.keydown);
```

compile this with [browserify](http://browserify.org) into a `bundle.js` then
write some html:

``` html
<html>
  <head>
    <title>terminal</title>
    <style>
      #terminal {
        position: absolute;
        left: 0px;
        top: 0px;
        bottom: 0px;
        right: 50%;
        padding: 10px 15px 10px 15px;
        background: black;
        font-family: monaco, monospace;
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <div id="terminal"></div>
    <script src="/bundle.js"></script>
  </body>
</html>
```

# methods

``` js
var terminal = require('browser-terminal')
```

## var term = terminal()

Create a new terminal duplex stream `term`.

## term.appendTo(target)

Append the browser html element to the html element or query selector string
`target`.

## term.keydown(ev)

Respond to a keydown event `ev`. Unless you want to do fancy things, you can
just forward along all keydown events:

``` js
window.addEventListener('keydown', term.keydown)
```

# install

With [npm](https://npmjs.org) do:

```
npm install browser-terminal
```

# license

MIT
