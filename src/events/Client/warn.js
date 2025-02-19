const Event = require("../../structure/Event");

module.exports = new Event({
    event: 'warn',
    once: false,
    run: (__client__, info) => {
        __client__.logger.warn(info);
    }
}).toJSON();