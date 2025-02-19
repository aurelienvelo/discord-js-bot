const Event = require("../../structure/Event");

module.exports = new Event({
    event: 'debug',
    once: false,
    run: (__client__, info) => {
        __client__.logger.debug(info);
    }
}).toJSON();