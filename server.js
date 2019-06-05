#!/usr/bin/env node

process.on('uncaughtException', ({message, stack}) => console.error(message, stack));

const http = require('http');
const fs = require('fs');
const originalHar = JSON.parse(fs.readFileSync(`${process.argv[2]}`, 'utf8')).log.entries;

const har = JSON.parse(JSON.stringify(originalHar));

const app = http.createServer((req, res) => {
    try {

        let findRequest = (entity) => entity.request.url.endsWith(req.url) && req.method === entity.request.method;

        let harEntityIndex = har.findIndex(findRequest);
        let harEntity;

        if(harEntityIndex < 0) {
            let reverseOriginal = JSON.parse(JSON.stringify(originalHar)).reverse();

            harEntityIndex = reverseOriginal.findIndex(findRequest);

            if (harEntityIndex < 0) {
                res.statusCode = 404;
                let msg = 'sorry this har file does not contain the request requested';
                console.log('req', req.method.padEnd(8, ' '), req.url, msg);
                return res.end(msg);
            }
            else {
                harEntity = reverseOriginal.splice(harEntityIndex, 1)[0];
            }
        }
        else {
            harEntity = har.splice(harEntityIndex, 1)[0];
        }

        console.log('req', req.method.padEnd(8, ' '), req.url);

        res.statusCode = harEntity.response.status;
        harEntity.response.headers.forEach(({name, value}) => res.setHeader(name, value));
        res.setHeader('Date', (new Date()).toUTCString());

        setTimeout(() => {
            res.end(harEntity.response.content.text);
        }, req.method !== 'OPTIONS' ? (parseInt(process.argv[4]) || 10) : 10);

    }
    catch(e) {
        console.error('Error!', e.message, e.stack);
    }
});

let port = process.argv[3];
console.log(`listening on port ${port}`);
app.listen(port);


