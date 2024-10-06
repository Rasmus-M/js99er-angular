const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');

const myConsole = new console.Console(fs.createWriteStream('./log.txt'));

const server = http.createServer((req, res) => {
    const query = url.parse(req.url, true).query;
    const queryUrl = query['url'];
    if (queryUrl) {
        myConsole.log("Downloading " + queryUrl + "\n");
        try {
            if (queryUrl.startsWith('https')) {
                https.get(queryUrl, (response) => {
                    res.writeHead(200, {
                        'Content-Type': 'application/octet-stream',
                        'Content-disposition': 'attachment; filename=' + queryUrl.split('/').pop()
                    });
                    response.pipe(res);
                });
            } else {
                http.get(queryUrl, (response) => {
                    res.writeHead(200, {
                        'Content-Type': 'application/octet-stream',
                        'Content-disposition': 'attachment; filename=' + queryUrl.split('/').pop()
                    });
                    response.pipe(res);
                });
            }
        } catch (err) {
            myConsole.error(err);
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end(String(err));
        }
    } else {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end("No url parameter provided.");
    }
});
server.listen();
