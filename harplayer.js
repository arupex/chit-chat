
const fs = require('fs');

const URL = require('url');

class HarPlayer {

    constructor(harfile) {
        this.originalHar = JSON.parse(fs.readFileSync(`${harfile}`, 'utf8')).log.entries;
        this.har = JSON.parse(fs.readFileSync(`${harfile}`, 'utf8')).log.entries;
    }

    getClone() {
        return JSON.parse(JSON.stringify(this.originalHar));
    }

    domains() {
        return Object.keys(this.originalHar.reduce( (acc, {request}) => {
            let host = URL.parse(request.url).host;
            if(host.includes(':')){
                host = host.substr(0, host.indexOf(':'));
            }
            return Object.assign(acc,{[host] : true})
        }, {}));
    }

    middleware({delay = 10, cors, httpsRewrite, verbose}) {
        return (req, res) => {
            try {
                let protocolLess = req.url
                    .replace(/https:\/\//g, '' )
                    .replace(/http:\/\//g, '');

                if(verbose) {
                    console.log('', req.method.padEnd(8, ' '), protocolLess);
                }

                let findRequest = (entity) => entity.request.url.endsWith(protocolLess) && req.method === entity.request.method;

                let harEntityIndex = this.har.findIndex(findRequest);
                let harEntity;

                if (harEntityIndex < 0) {
                    let reverseOriginal = this.getClone().reverse();

                    harEntityIndex = reverseOriginal.findIndex(findRequest);

                    if (harEntityIndex < 0) {
                        res.statusCode = 404;
                        let msg = 'sorry this har file does not contain the request requested';
                        console.error('', req.method.padEnd(8, ' '), protocolLess, msg);
                        return res.end(msg);
                    } else {
                        harEntity = reverseOriginal.splice(harEntityIndex, 1)[0];
                    }
                } else {
                    harEntity = this.har.splice(harEntityIndex, 1)[0];
                }

                res.statusCode = harEntity.response.status;
                harEntity.response.headers.forEach(({name, value}) => {

                    let lName = name.toLowerCase();

                    if(lName === 'content-length') {
                        // no op
                    }
                    else if(lName === 'content-encoding') {
                        // no op
                    }
                    else if(lName === 'date') {
                        res.setHeader('Date', (new Date()).toUTCString());
                    }
                    else if(lName ==='last-modified') {
                        let date1 = new Date();
                        res.setHeader('Date', (date1).toUTCString());
                    }
                    else if(lName === 'expires') {
                        let date = new Date();
                        date.setDate(date.getDate() + 1);
                        res.setHeader('Date', (date).toUTCString());
                    }
                    else {
                        res.setHeader(name, value);
                    }
                });


                if (cors) {
                    res.setHeader('Access-Control-Allow-Origin', cors);
                }

                setTimeout(() => {

                    if(httpsRewrite && harEntity.response.content.text.includes('https')) {
                        if(verbose) {
                            console.log(`rewriting payload with http instead of https 😉`);
                        }
                        res.end(harEntity.response.content.text.replace(/https/g, 'http'));
                    }
                    else {
                        res.end(harEntity.response.content.text);
                    }
                }, req.method !== 'OPTIONS' ? (parseInt(delay) || 10) : 10);

            } catch (e) {
                console.error('Error!', e.message, e.stack);
            }
        };
    }
}

module.exports = HarPlayer;