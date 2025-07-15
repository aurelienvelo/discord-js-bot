const config = require("../config");

class RadarrHandler {
    constructor() {
        this.eventTypeMap = {
            'Download': { emoji: '📥', color: 0x00ff00, name: 'Téléchargement' },
            'Rename': { emoji: '🔄', color: 0x0099ff, name: 'Renommage' },
            'MovieFileDelete': { emoji: '🗑️', color: 0xff6600, name: 'Suppression' },
            'MovieDelete': { emoji: '❌', color: 0xff0000, name: 'Film supprimé' },
            'Grab': { emoji: '🎯', color: 0xffff00, name: 'Récupération' },
            'Test': { emoji: '🧪', color: 0x7289da, name: 'Test' },
            'Health': { emoji: '❤️', color: 0x00cc99, name: 'Santé' },
            'ApplicationUpdate': { emoji: '🆙', color: 0x9966cc, name: 'Mise à jour' }
        };
    }

    /**
     * Récupère les informations de formatage pour un type d'événement
     * @param {string} eventType - Type d'événement Radarr
     * @returns {Object} - Informations de formatage (emoji, couleur, nom)
     */
    getEventTypeInfo(eventType) {
        return this.eventTypeMap[eventType] || {
            emoji: '📡',
            color: 0x7289da,
            name: eventType || 'Événement inconnu'
        };
    }

    /**
     * Extrait les informations du film depuis le payload
     * @param {Object} movie - Objet film du payload
     * @param {Object} remoteMovie - Objet film distant du payload
     * @returns {Object} - Informations formatées du film
     */
    extractMovieInfo(movie, remoteMovie) {
        const movieData = movie || remoteMovie || {};
        
        return {
            title: movieData.title || 'Film inconnu',
            year: movieData.year ? `(${movieData.year})` : '',
            imdbId: movieData.imdbId || null,
            tmdbId: movieData.tmdbId || null,
            quality: movieData.quality?.quality?.name || 'Qualité inconnue',
            path: movieData.path || 'Chemin inconnu'
        };
    }

    /**
     * Extrait les informations de release depuis le payload
     * @param {Object} release - Objet release du payload
     * @returns {Object} - Informations formatées du release
     */
    extractReleaseInfo(release) {
        if (!release) return null;

        return {
            releaseTitle: release.releaseTitle || 'Release inconnu',
            indexer: release.indexer || 'Indexeur inconnu',
            size: release.size ? this.formatFileSize(release.size) : 'Taille inconnue',
            quality: release.quality?.quality?.name || 'Qualité inconnue'
        };
    }

    /**
     * Formate la taille de fichier en unités lisibles
     * @param {number} bytes - Taille en bytes
     * @returns {string} - Taille formatée
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    /**
     * Construit les champs de l'embed selon le type d'événement
     * @param {string} eventType - Type d'événement
     * @param {Object} movieInfo - Informations du film
     * @param {Object} releaseInfo - Informations du release
     * @param {string} instanceName - Nom de l'instance Radarr
     * @returns {Array} - Liste des champs pour l'embed
     */
    buildEmbedFields(eventType, movieInfo, releaseInfo, instanceName) {
        const fields = [];

        // Champ instance
        if (instanceName) {
            fields.push({
                name: '📡 Instance',
                value: instanceName,
                inline: true
            });
        }

        // Champs spécifiques selon le type d'événement
        switch (eventType) {
            case 'Download':
            case 'Grab':
                if (movieInfo.quality) {
                    fields.push({
                        name: '🎬 Qualité',
                        value: movieInfo.quality,
                        inline: true
                    });
                }
                
                if (releaseInfo) {
                    fields.push({
                        name: '📦 Release',
                        value: releaseInfo.releaseTitle,
                        inline: false
                    });
                    
                    if (releaseInfo.size !== 'Taille inconnue') {
                        fields.push({
                            name: '💾 Taille',
                            value: releaseInfo.size,
                            inline: true
                        });
                    }
                    
                    if (releaseInfo.indexer !== 'Indexeur inconnu') {
                        fields.push({
                            name: '🔍 Indexeur',
                            value: releaseInfo.indexer,
                            inline: true
                        });
                    }
                }
                break;

            case 'Rename':
            case 'MovieFileDelete':
                if (movieInfo.path !== 'Chemin inconnu') {
                    fields.push({
                        name: '📁 Chemin',
                        value: movieInfo.path,
                        inline: false
                    });
                }
                break;

            default:
                // Champs génériques
                if (movieInfo.quality) {
                    fields.push({
                        name: '🎬 Qualité',
                        value: movieInfo.quality,
                        inline: true
                    });
                }
        }

        // Liens externes si disponibles
        const externalLinks = [];
        if (movieInfo.imdbId) {
            externalLinks.push(`[IMDb](https://www.imdb.com/title/${movieInfo.imdbId})`);
        }
        if (movieInfo.tmdbId) {
            externalLinks.push(`[TMDb](https://www.themoviedb.org/movie/${movieInfo.tmdbId})`);
        }
        
        if (externalLinks.length > 0) {
            fields.push({
                name: '🔗 Liens',
                value: externalLinks.join(' • '),
                inline: false
            });
        }

        return fields;
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

        if (!payload.eventType) {
            errors.push('Type d\'événement manquant');
        }

        if (!payload.movie && !payload.remoteMovie) {
            errors.push('Aucune information de film trouvée');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Envoie un message de debug vers le canal d'administration
     * @param {DiscordBot} client - Instance du bot Discord
     * @param {string} eventType - Type d'événement
     * @param {Object} payload - Payload complet
     */
    async sendDebugMessage(client, eventType, payload) {
        try {
            const adminChannelId = config.webhookChannels?.radarr?.admin;
            if (!adminChannelId) return;

            const adminChannel = await client.channels.fetch(adminChannelId);
            if (!adminChannel) {
                client.logger.warn('Canal d\'administration Radarr introuvable');
                return;
            }

            const debugMessage = `🚀 **Webhook Radarr reçu**\n` +
                `**Type:** ${eventType}\n` +
                `**Payload:** \`\`\`json\n${JSON.stringify(payload, null, 2)}\`\`\``;

            await adminChannel.send(debugMessage);
        } catch (error) {
            client.logger.error('Erreur lors de l\'envoi du message de debug:', error.message);
        }
    }

    /**
     * Fonction principale pour traiter une notification Radarr
     * @param {DiscordBot} client - Instance du bot Discord
     * @param {string} source - Source de la notification
     * @param {Object} payload - Données reçues du webhook Radarr
     * @returns {Promise<Object|null>} - Embed Discord ou null en cas d'erreur
     */
    async handleNotification(client, source, payload) {
        try {
            // Validation du payload
            const validation = this.validatePayload(payload);
            if (!validation.isValid) {
                client.logger.error(`Payload Radarr invalide: ${validation.errors.join(', ')}`);
                return null;
            }

            const { instanceName, eventType, movie, remoteMovie, release } = payload;

            // Envoi du message de debug
            await this.sendDebugMessage(client, eventType, payload);

            // Extraction des informations
            const eventInfo = this.getEventTypeInfo(eventType);
            const movieInfo = this.extractMovieInfo(movie, remoteMovie);
            const releaseInfo = this.extractReleaseInfo(release);

            // Construction des champs
            const fields = this.buildEmbedFields(eventType, movieInfo, releaseInfo, instanceName);

            // Construction de l'embed
            const embed = {
                author: {
                    name: 'Radarr',
                    icon_url: 'https://raw.githubusercontent.com/Radarr/Radarr/develop/Logo/256.png'
                },
                title: `${eventInfo.emoji} ${eventInfo.name}`,
                description: `**${movieInfo.title}** ${movieInfo.year}`,
                color: eventInfo.color,
                fields: fields,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Radarr`,
                    icon_url: 'https://raw.githubusercontent.com/Radarr/Radarr/develop/Logo/64.png'
                }
            };

            // Log de succès
            client.logger.info(`Notification Radarr [${eventType}] traitée avec succès pour: ${movieInfo.title}`);

            return embed;

        } catch (error) {
            client.logger.error(`Erreur lors du traitement de la notification Radarr: ${error.message}`, {
                stack: error.stack,
                payload: payload ? JSON.stringify(payload, null, 2) : 'undefined'
            });
            return null;
        }
    }
}

module.exports = new RadarrHandler();