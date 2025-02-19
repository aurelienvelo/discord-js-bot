const config = require("../config");
const ConstantTranslator = require('../utils/translate');

const translator = new ConstantTranslator();

module.exports = {
    /**
     * Fonction métier pour envoyer un message sur un canal Discord spécifique
     * @param {DiscordBot} client - Les données reçues du webhook Overseerr
     * @param {Object} payload - Les données reçues du webhook Overseerr
     */
    handleNotification: async (client, payload) => {
        const { notification_type, event, subject, message, image, media, request, extra } = payload;

        // Trouver le canal Discord correspondant
        let channelId = config.webhookChannels.overseerr.channelMapping[notification_type]?.[event];
        if (!channelId) {
            client.logger.warn(`Aucun canal mappé pour notification_type: ${notification_type}, event: ${event}`);
            return;
        }

        try {
            // Envoi à un canal d'administration Discord
            const channelAdminId = config.webhookChannels.overseerr.admin;
            if (channelAdminId) {
                const channelAdmin = await client.channels.fetch(channelAdminId);
                if (channelAdmin) {
                    channelAdmin.send(`🚀 Webhook [${notification_type}] reçu : ${JSON.stringify(payload)}`);
                }
            }
            
            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                client.logger.error(`Canal Discord introuvable pour l'ID: ${channelId}`);
                return;
            }

            const api_media = {title: undefined, description: undefined}
            switch (media.media_type) {
                case 'movie':
                    const m = await client.overseerrService.getMovie(media.tmdbId);
                    api_media.title = m.title;
                    api_media.description = m.overview;
                    break;
                case 'tv':
                    const t = await client.overseerrService.getTv(media.tmdbId);
                    api_media.title = t.title;
                    api_media.description = t.overview;
                    break;
            }

            let fields = []
            if (request) {
                fields.push({
                    name: 'Demandé par',
                    value: request.requestedBy_username,
                    inline: true,
                })
            }

            if (media) {
                fields.push({
                    name: 'Etat de la demande',
                    value: translator.translate('overseerr', 'media_status', media.status),
                    inline: true,
                })
            }

            if (extra && extra.length > 0) {
                fields.push({
                    name: 'Saison demandée',
                    value: extra[0].value,
                    inline: true,
                })
            }

            // Construire le message
            const embed = {
                author: { name: translator.translate('overseerr', 'event', event) },
                title: api_media.title,
                description: api_media.description,
                thumbnail: image ? { url: image } : undefined,
                color: 0x00ff00, // Couleur du message
                fields: fields,
            };

            // Envoyer le message
            await channel.send({ embeds: [embed] });
            client.logger.info(`Message envoyé dans le canal ${channelId}`);
        } catch (err) {
            client.logger.error(`Erreur lors de l\'envoi du message Discord: ${err}`);
        }
    }
}
