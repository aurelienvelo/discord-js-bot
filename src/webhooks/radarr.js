const config = require("../config");

module.exports = {
    /**
     * Fonction métier pour envoyer un message sur un canal Discord spécifique
     * @param {DiscordBot} client - Les données reçues du webhook Overseerr
     * @param {Object} payload - Les données reçues du webhook Overseerr
     */
    handleNotification: async (client, payload) => {
        const { instanceName, eventType, movie, remoteMovie, release } = payload;

        // Trouver le canal Discord correspondant
        let channelId = config.webhookChannels.radarr.channelMapping[instanceName]?.[eventType];
        if (!channelId) {
            client.logger.warn(`Aucun canal mappé pour instanceName: ${instanceName}, eventType: ${eventType}`);
            return;
        }

        try {
            // Envoi à un canal d'administration Discord
            const channelAdminId = config.webhookChannels.radarr.admin;
            if (channelId) {
                const channelAdmin = await client.channels.fetch(channelAdminId);
                if (channelAdmin) {
                    channelAdmin.send(`🚀 Webhook [${eventType}] reçu : ${JSON.stringify(payload)}`);
                }
            }

            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                client.logger.error(`Canal Discord introuvable pour l'ID: ${channelId}`);
                return;
            }

            // Construire le message
            const embed = {
                title: `Notification Radarr ${eventType}`,
                description: `🚀 Webhook [${instanceName}] reçu : ${JSON.stringify(payload)}`,
                color: 0x00ff00 // Couleur du message
            };

            // Envoyer le message
            await channel.send({ embeds: [embed] });
            client.logger.info(`Message envoyé dans le canal ${channelId}`);
        } catch (error) {
            client.logger.error('Erreur lors de l\'envoi du message Discord:', error);
        }
    }
}
