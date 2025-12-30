const NotificationService = require('../utils/notificationUtils');
const handlers = {
    overseerr: require('./overseerr'),
    radarr: require('./radarr'),
    sonarr: require('./sonarr'),
    tdarr: require('./tdarr'),
};

const handleWebhook = async (client, source, payload) => {
    let embed;
    try {
        // ... ton switch case reste identique ...
        // On s'assure que le handler retourne bien l'objet de l'embed
        embed = await handlers[source].handleNotification(client, source, payload);

        if (!embed) return;

        // Passage du payload en 4ème argument pour le log JSON
        const results = await NotificationService.sendNotificationToAll(
            client, 
            source, 
            embed, 
            payload, // <--- On envoie le JSON brut ici
            { includeAdminInfo: true }
        );

        // ... tes logs logger.info ...
        return results;
    } catch (error) {
        client.logger.error(`Erreur webhook ${source}:`, error);
    }
}