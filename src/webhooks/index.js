const overseerr = require('./overseerr');
const radarr = require('./radarr');
const sonarr = require('./sonarr');
const tdarr = require('./tdarr');

const handleWebhook = async (client, type, payload) => {

    switch (type) {
        case 'overseerr':
            await overseerr.handleNotification(client, payload);
            break;
        case 'radarr':
            await radarr.handleNotification(client, payload);
            break;
        case 'sonarr':
            await sonarr.handleNotification(client, payload);
            break;
        case 'tdarr':
            await tdarr.handleNotification(client, payload);
            break;
        default:
            client.logger.warn(`Unknown webhook: ${type}.`);
    }
}

module.exports = {
    handleWebhook,
    // overseerr,
    // radarr,
    // sonarr,
    // tdarr,
};
