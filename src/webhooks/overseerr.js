const config = require("../config");

class OverseerrHandler {
    constructor() {}

    /**
     * Récupère les informations du média depuis l'API Overseerr
     * @param {DiscordBot} client - Instance du bot Discord
     * @param {Object} media - Objet média du payload
     * @returns {Promise<Object>} - Informations du média (title, description)
     */
    async getMediaInfo(client, media) {
        if (!media || !media.media_type || !media.tmdbId) {
            return { title: 'Média inconnu', description: 'Aucune information disponible' };
        }

        try {
            switch (media.media_type) {
                case 'movie':
                    const movie = await client.overseerrService.getMovie(media.tmdbId);
                    return {
                        title: movie?.title || 'Film inconnu',
                        description: movie?.overview || 'Aucune description disponible'
                    };
                
                case 'tv':
                    const tvShow = await client.overseerrService.getTv(media.tmdbId);
                    return {
                        title: tvShow?.title || 'Série inconnue',
                        description: tvShow?.overview || 'Aucune description disponible'
                    };
                
                default:
                    client.logger.warn(`Type de média non supporté: ${media.media_type}`);
                    return {
                        title: 'Type de média non supporté',
                        description: `Type: ${media.media_type}`
                    };
            }
        } catch (error) {
            client.logger.error(`Erreur lors de la récupération des informations du média: ${error.message}`);
            return {
                title: 'Erreur de récupération',
                description: 'Impossible de récupérer les informations du média'
            };
        }
    }

    /**
     * Construit les champs de l'embed Discord
     * @param {Object} payload - Payload complet de la notification
     * @returns {Array} - Liste des champs pour l'embed
     */
    buildEmbedFields(payload) {
        const { media, request, extra } = payload;
        const fields = [];

        // Champ pour l'état du média
        if (media?.status) {
            fields.push({
                name: 'État de la demande',
                value: this.translator.translate('overseerr', 'media_status', media.status),
                inline: true,
            });
        }

        // Champ pour le demandeur
        if (request?.requestedBy_username) {
            fields.push({
                name: 'Demandé par',
                value: request.requestedBy_username,
                inline: true,
            });
        }

        // Champ pour les informations supplémentaires (saisons, etc.)
        if (extra && Array.isArray(extra) && extra.length > 0) {
            fields.push({
                name: 'Saison demandée',
                value: extra[0].value || 'Non spécifiée',
                inline: true,
            });
        }

        return fields;
    }

    /**
     * Détermine la couleur de l'embed selon le type d'événement
     * @param {string} event - Type d'événement
     * @param {string} notificationType - Type de notification
     * @returns {number} - Couleur hexadécimale
     */
    getEmbedColor(event, notificationType) {
        const colorMap = {
            'REQUEST_APPROVED': 0x00ff00,    // Vert
            'REQUEST_DENIED': 0xff0000,      // Rouge
            'REQUEST_PENDING': 0xffff00,     // Jaune
            'MEDIA_AVAILABLE': 0x0099ff,     // Bleu
            'MEDIA_FAILED': 0xff6600,        // Orange
            'REQUEST_AUTOMATICALLY_APPROVED': 0x00cc99, // Vert clair
        };

        return colorMap[event] || colorMap[notificationType] || 0x7289da; // Couleur par défaut (Discord bleu)
    }

    /**
     * Valide le payload reçu
     * @param {Object} payload - Payload à valider
     * @returns {Object} - Résultat de la validation
     */
    validatePayload(payload) {
        const errors = [];

        if (!payload) {
            errors.push('Payload vide ou undefined');
        }

        if (!payload.event && !payload.notification_type) {
            errors.push('Aucun type d\'événement ou de notification spécifié');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Fonction principale pour traiter une notification Overseerr
     * @param {DiscordBot} client - Instance du bot Discord
     * @param {string} source - Source de la notification
     * @param {Object} payload - Données reçues du webhook Overseerr
     * @returns {Promise<Object|null>} - Embed Discord ou null en cas d'erreur
     */
    async handleNotification(client, source, payload) {
        try {
            // Validation du payload
            const validation = this.validatePayload(payload);
            if (!validation.isValid) {
                client.logger.error(`Payload invalide: ${validation.errors.join(', ')}`);
                return null;
            }

            const { notification_type, event, subject, message, image, media, request, extra } = payload;

            // Récupération des informations du média
            const mediaInfo = await this.getMediaInfo(client, media);

            // Construction des champs
            const fields = this.buildEmbedFields(payload);

            // Détermination de la couleur
            const color = this.getEmbedColor(event, notification_type);

            // Construction de l'embed
            const embed = {
                author: { 
                    name: this.translator.translate('overseerr', 'event', event || notification_type) 
                },
                title: mediaInfo.title,
                description: mediaInfo.description,
                thumbnail: image ? { url: image } : undefined,
                color: color,
                fields: fields,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Overseerr`,
                    icon_url: 'https://raw.githubusercontent.com/sct/overseerr/develop/public/logo_full.svg'
                }
            };

            // Log de succès
            client.logger.info(`Notification Overseerr traitée avec succès pour: ${mediaInfo.title}`);

            return embed;

        } catch (error) {
            client.logger.error(`Erreur lors du traitement de la notification Overseerr: ${error.message}`, {
                stack: error.stack,
                payload: JSON.stringify(payload, null, 2)
            });
            return null;
        }
    }
}

module.exports = new OverseerrHandler();