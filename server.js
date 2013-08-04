var http = require('http');
var ecstatic = require('ecstatic')(__dirname + '/static');

var server = http.createServer(function (req, res) {
    ecstatic(req, res);
});
server.listen(parseInt(process.argv[2]) || 5000);
