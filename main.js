const feed = require('rss-to-json');
const fs = require('fs');
const pushover = require('pushover-notifications');
const log4js = require('log4js');

// Configure pushover
var p = new pushover({
    user: process.env['PUSHOVER_USER'],
    token: process.env['PUSHOVER_TOKEN']
});

// Configure log4js
log4js.configure({
    appenders: { 
        file: { type: 'file', filename: 'funda-notifier.log', maxLogSize: 10485760, backups: 3, compress: true },
        out: { type: 'stdout' }
    },
    categories: { default: { appenders: ['file', 'out'], level: 'info' } }
});
const logger = log4js.getLogger();

function notifyForFundaListings (type, city, minPrice, maxPrice, amountKms) {
    feed.load(`http://partnerapi.funda.nl/feeds/Aanbod.svc/rss/?type=${type}&zo=/${city}/${minPrice}-${maxPrice}/+${amountKms}/sorteer-datum-af/`, function(err, rss) {   
        if (!err) {
            let items = rss.items;
            let dir = './data/';
            let idregex = /([0-9]{5,})/g;

            if (items.length > 0 && !fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }

            for (let item of items) {
                let filename = item.url.match(idregex) + '.json';
                if (!fs.existsSync(dir + filename)) {
                    let amountRegex = /(\d+\.\d+)/g;
                    let spaceRegex = /\-\ (.*)/g;
                    var space = item.description.match(spaceRegex)[0];
                    let message = item.title.replace('Te koop: ', '') + '\n' +
                        space.substr(2, space.length) + '\n' +
                        '€' + item.description.match(amountRegex);
                    p.send({
                        title: 'Funda Notifier',
                        message: message,
                        sound: 'magic',
                        priority: 0
                    }, function(err, result) {
                        if (err) {
                            logger.error('Error while sending pushover request');
                        } else {
                            logger.info('Succesfully sent pushover request for ' + filename);
                        }
                    });
                    //fs.writeFileSync(dir + filename, JSON.stringify(item));
                } else {
                    logger.info(filename + ' already exists.');
                }
            }
        } else {
            logger.error('Error: ' + err);
        }
    });
}

notifyForFundaListings('koop', 'amsterdam', '10000', '500000', '1km');