#!/usr/bin/env node

process.on('uncaughtException', ({message, stack}) => console.error(message, stack));

const http = require('http');

const ARGS = process.argv.filter(e => e.indexOf('=') !== -1).reduce((acc, value) => {let kv = value.split('=');acc[kv[0].replace(/^-*/g, '')] = kv[1];return acc;}, {});

const HarPlayer = require('./harplayer');

const harplayer = new HarPlayer(ARGS.har);

if(ARGS.verbose) {
    const domains = harplayer.domains();
    console.log('\n\tdomains:\n', domains.map(e => `\t\t${e}`).join('\n'), '\n');
}

const httpApp = http.createServer(harplayer.middleware({ delay : ARGS.delay, cors : ARGS.cors, httpsRewrite: ARGS.httpsRewrite, verbose : ARGS.verbose }));

if(!ARGS.https) {
    console.log(`har-time-player is http listening on port ${ARGS.port}`);
    httpApp.listen(ARGS.port);

}
else {
    const https = require('https');
    const pem = require('pem');

    pem.createCertificate({ days: 2, selfSigned: true }, function (err, keys) {
        if (err) {
            throw err
        }
        const httpsApp = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, harplayer.middleware({ delay : ARGS.delay, cors : ARGS.cors, httpsRewrite: false, verbose : ARGS.verbose }));
        console.log(`har-time-player is https listening on port ${ARGS.port}`);
        httpsApp.listen(ARGS.port)
    })
}