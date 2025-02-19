const Event = require("../../structure/Event");

module.exports = new Event({
    event: 'error',
    once: false,
    run: (__client__, error) => {
        __client__.logger.error(error);
    }
}).toJSON();