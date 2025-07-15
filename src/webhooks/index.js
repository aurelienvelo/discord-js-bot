const overseerrHandler = require('./overseerr');
const radarrHandler = require('./radarr');
const sonarrHandler = require('./sonarr');
const tdarrHandler = require('./tdarr');
const { sendNotification } = require('../utils/notificationUtils');

const handleWebhook = async (client, source, payload) => {
    let message;
    try {
        switch (source) {
            case 'overseerr':
                message = await overseerrHandler.handleNotification(client, source, payload);
                break;
            case 'radarr':
                message = await radarrHandler.handleNotification(client, source, payload);
                break;
            case 'sonarr':
                message = await sonarrHandler.handleNotification(client, source, payload);
                break;
            case 'tdarr':
                message = await tdarrHandler.handleNotification(client, source, payload);
                break;
            default:
                client.logger.warn(`Unknown webhook: ${source}.`);
        }

        // Envoi de la notification
        const results = await sendNotification(client, source, message);

        // Log des résultats
        client.logger.info(`[${source}] Notifications envoyées:`);
        client.logger.info(`✅ Succès (${results.success.length}):`, results.success);
        if (results.failed.length > 0) {
            client.logger.info(`❌ Échecs (${results.failed.length}):`, results.failed);
            client.logger.error(`Échecs lors de l'envoi des notifications pour ${source}:`, results.failed.join(','));
        }

        return results;
    } catch (error) {
        client.logger.error(`Erreur lors de l'envoi des notifications ${source}:`, error);
        return { success: [], failed: [error.message], totalSent: 0 };
    }
}

module.exports = {
    handleWebhook,
};
