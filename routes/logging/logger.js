/**
 * Created by dungatla on 6/23/17.
 */

var winston = require('winston');


var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: 'somefile.log' })
    ]
});

module.exports = logger;