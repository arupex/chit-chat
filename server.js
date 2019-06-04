#!/usr/bin/env node

process.on('uncaughtException', (err, origin) => {
    console.error('', err.message, err.stack);
});


const http = require('http');

const fs = require('fs');

const har = JSON.parse(fs.readFileSync(`${process.argv[2]}`, 'utf8')).log.entries;

const app = http.createServer((req, res) => {
    try {
        console.log('req', req.method, req.url);

        let harEntityIndex = har.findIndex((entity) => {
            return entity.request.url.includes(req.url) && req.method === entity.request.method
        });

        if(harEntityIndex < 0) {
            res.statusCode = 404;
            return res.end('sorry this har file does not contain the request requested');
        }

        let harEntity = har.splice(harEntityIndex, 1)[0];

        res.statusCode = harEntity.response.status;
        harEntity.response.headers.forEach(({name, value}) => {
            res.setHeader(name, value)
        });

        res.end(harEntity.response.content.text);
    }
    catch(e) {
        console.error('Error!', e.message, e.stack);
    }
});

let port = process.argv[3];
console.log(`listening on port ${port}`);
app.listen(port);


