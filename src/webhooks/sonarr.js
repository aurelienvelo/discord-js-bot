const config = require("../config");

class SonarrHandler {
    constructor() {
        this.eventTypeMap = {
            'Download': { emoji: '📥', color: 0x00ff00, name: 'Épisode téléchargé' },
            'EpisodeFileDelete': { emoji: '🗑️', color: 0xff6600, name: 'Épisode supprimé' },
            'Grab': { emoji: '🎯', color: 0xffff00, name: 'Épisode récupéré' },
            'Rename': { emoji: '🔄', color: 0x0099ff, name: 'Épisode renommé' },
            'SeriesDelete': { emoji: '❌', color: 0xff0000, name: 'Série supprimée' },
            'Test': { emoji: '🧪', color: 0x7289da, name: 'Test webhook' },
            'Health': { emoji: '❤️', color: 0x00cc99, name: 'Vérification santé' },
            'ApplicationUpdate': { emoji: '🆙', color: 0x9966cc, name: 'Mise à jour Sonarr' }
        };
    }

    /**
     * Récupère les informations de formatage pour un type d'événement
     * @param {string} eventType - Type d'événement Sonarr
     * @returns {Object} - Informations de formatage (emoji, couleur, nom)
     */
    getEventTypeInfo(eventType) {
        return this.eventTypeMap[eventType] || {
            emoji: '📺',
            color: 0x7289da,
            name: eventType || 'Événement inconnu'
        };
    }

    /**
     * Extrait les informations de la série depuis le payload
     * @param {Object} series - Objet série du payload
     * @param {Object} remoteSeries - Objet série distante du payload
     * @returns {Object} - Informations formatées de la série
     */
    extractSeriesInfo(series, remoteSeries) {
        const seriesData = series || remoteSeries || {};
        
        return {
            title: seriesData.title || 'Série inconnue',
            year: seriesData.year ? `(${seriesData.year})` : '',
            imdbId: seriesData.imdbId || null,
            tvdbId: seriesData.tvdbId || null,
            tmdbId: seriesData.tmdbId || null,
            network: seriesData.network || null,
            status: seriesData.status || 'Statut inconnu',
            path: seriesData.path || 'Chemin inconnu',
            type: seriesData.seriesType || 'Type inconnu'
        };
    }

    /**
     * Extrait les informations d'épisode depuis le payload
     * @param {Object} payload - Payload complet
     * @returns {Object|null} - Informations formatées de l'épisode
     */
    extractEpisodeInfo(payload) {
        const episodes = payload.episodes || [];
        if (episodes.length === 0) return null;

        // Si plusieurs épisodes, on prend le premier ou on fait un résumé
        if (episodes.length === 1) {
            const episode = episodes[0];
            return {
                seasonNumber: episode.seasonNumber || 'S?',
                episodeNumber: episode.episodeNumber || 'E?',
                title: episode.title || 'Titre inconnu',
                airDate: episode.airDate || null,
                quality: episode.quality?.quality?.name || payload.episodeFile?.quality?.quality?.name || 'Qualité inconnue'
            };
        } else {
            // Plusieurs épisodes
            const seasonNumbers = [...new Set(episodes.map(ep => ep.seasonNumber))];
            const episodeNumbers = episodes.map(ep => ep.episodeNumber).join(', ');
            
            return {
                seasonNumber: seasonNumbers.length === 1 ? `S${seasonNumbers[0]}` : 'Multiples saisons',
                episodeNumber: `E${episodeNumbers}`,
                title: `${episodes.length} épisodes`,
                airDate: null,
                quality: episodes[0]?.quality?.quality?.name || payload.episodeFile?.quality?.quality?.name || 'Qualité inconnue',
                count: episodes.length
            };
        }
    }

    /**
     * Extrait les informations de release depuis le payload
     * @param {Object} release - Objet release du payload
     * @returns {Object|null} - Informations formatées du release
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
     * Formate la date de diffusion
     * @param {string} airDate - Date au format ISO
     * @returns {string} - Date formatée
     */
    formatAirDate(airDate) {
        if (!airDate) return null;
        
        try {
            const date = new Date(airDate);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return airDate;
        }
    }

    /**
     * Construit les champs de l'embed selon le type d'événement
     * @param {string} eventType - Type d'événement
     * @param {Object} seriesInfo - Informations de la série
     * @param {Object} episodeInfo - Informations de l'épisode
     * @param {Object} releaseInfo - Informations du release
     * @param {string} instanceName - Nom de l'instance Sonarr
     * @returns {Array} - Liste des champs pour l'embed
     */
    buildEmbedFields(eventType, seriesInfo, episodeInfo, releaseInfo, instanceName) {
        const fields = [];

        // Champ instance
        if (instanceName) {
            fields.push({
                name: '📡 Instance',
                value: instanceName,
                inline: true
            });
        }

        // Informations de l'épisode
        if (episodeInfo) {
            fields.push({
                name: '📺 Épisode',
                value: `${episodeInfo.seasonNumber}${episodeInfo.episodeNumber}${episodeInfo.title !== 'Titre inconnu' ? ` - ${episodeInfo.title}` : ''}`,
                inline: false
            });

            if (episodeInfo.quality && episodeInfo.quality !== 'Qualité inconnue') {
                fields.push({
                    name: '🎬 Qualité',
                    value: episodeInfo.quality,
                    inline: true
                });
            }

            if (episodeInfo.airDate) {
                fields.push({
                    name: '📅 Date de diffusion',
                    value: this.formatAirDate(episodeInfo.airDate),
                    inline: true
                });
            }

            if (episodeInfo.count && episodeInfo.count > 1) {
                fields.push({
                    name: '📊 Nombre d\'épisodes',
                    value: `${episodeInfo.count}`,
                    inline: true
                });
            }
        }

        // Informations de la série
        if (seriesInfo.network) {
            fields.push({
                name: '📡 Réseau',
                value: seriesInfo.network,
                inline: true
            });
        }

        if (seriesInfo.status && seriesInfo.status !== 'Statut inconnu') {
            fields.push({
                name: '📊 Statut',
                value: seriesInfo.status,
                inline: true
            });
        }

        // Informations du release pour les événements Grab
        if (eventType === 'Grab' && releaseInfo) {
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

        // Chemin de fichier pour certains événements
        if (['Rename', 'EpisodeFileDelete'].includes(eventType) && seriesInfo.path !== 'Chemin inconnu') {
            fields.push({
                name: '📁 Chemin',
                value: seriesInfo.path,
                inline: false
            });
        }

        // Liens externes si disponibles
        const externalLinks = [];
        if (seriesInfo.imdbId) {
            externalLinks.push(`[IMDb](https://www.imdb.com/title/${seriesInfo.imdbId})`);
        }
        if (seriesInfo.tmdbId) {
            externalLinks.push(`[TMDb](https://www.themoviedb.org/tv/${seriesInfo.tmdbId})`);
        }
        if (seriesInfo.tvdbId) {
            externalLinks.push(`[TVDB](https://thetvdb.com/series/${seriesInfo.tvdbId})`);
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
     * Construit la description de l'embed
     * @param {Object} seriesInfo - Informations de la série
     * @param {Object} episodeInfo - Informations de l'épisode
     * @param {string} eventType - Type d'événement
     * @returns {string} - Description formatée
     */
    buildDescription(seriesInfo, episodeInfo, eventType) {
        let description = `**${seriesInfo.title}** ${seriesInfo.year}`;
        
        if (episodeInfo && ['Download', 'Grab', 'EpisodeFileDelete'].includes(eventType)) {
            description += `\n${episodeInfo.seasonNumber}${episodeInfo.episodeNumber}`;
            if (episodeInfo.title && episodeInfo.title !== 'Titre inconnu' && episodeInfo.count !== undefined) {
                description += ` - ${episodeInfo.title}`;
            }
        }
        
        return description;
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

        if (!payload.series && !payload.remoteSeries) {
            errors.push('Aucune information de série trouvée');
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
            const adminChannelId = config.webhookChannels?.sonarr?.admin;
            if (!adminChannelId) return;

            const adminChannel = await client.channels.fetch(adminChannelId);
            if (!adminChannel) {
                client.logger.warn('Canal d\'administration Sonarr introuvable');
                return;
            }

            const debugMessage = `🚀 **Webhook Sonarr reçu**\n` +
                `**Type:** ${eventType}\n` +
                `**Payload:** \`\`\`json\n${JSON.stringify(payload, null, 2)}\`\`\``;

            await adminChannel.send(debugMessage);
        } catch (error) {
            client.logger.error('Erreur lors de l\'envoi du message de debug:', error.message);
        }
    }

    /**
     * Fonction principale pour traiter une notification Sonarr
     * @param {DiscordBot} client - Instance du bot Discord
     * @param {string} source - Source de la notification
     * @param {Object} payload - Données reçues du webhook Sonarr
     * @returns {Promise<Object|null>} - Embed Discord ou null en cas d'erreur
     */
    async handleNotification(client, source, payload) {
        try {
            // Validation du payload
            const validation = this.validatePayload(payload);
            if (!validation.isValid) {
                client.logger.error(`Payload Sonarr invalide: ${validation.errors.join(', ')}`);
                return null;
            }

            const { instanceName, eventType, series, remoteSeries, release } = payload;

            // Envoi du message de debug
            await this.sendDebugMessage(client, eventType, payload);

            // Extraction des informations
            const eventInfo = this.getEventTypeInfo(eventType);
            const seriesInfo = this.extractSeriesInfo(series, remoteSeries);
            const episodeInfo = this.extractEpisodeInfo(payload);
            const releaseInfo = this.extractReleaseInfo(release);

            // Construction des champs et description
            const fields = this.buildEmbedFields(eventType, seriesInfo, episodeInfo, releaseInfo, instanceName);
            const description = this.buildDescription(seriesInfo, episodeInfo, eventType);

            // Construction de l'embed
            const embed = {
                author: {
                    name: 'Sonarr',
                    icon_url: 'https://raw.githubusercontent.com/Sonarr/Sonarr/develop/Logo/256.png'
                },
                title: `${eventInfo.emoji} ${eventInfo.name}`,
                description: description,
                color: eventInfo.color,
                fields: fields,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Sonarr`,
                    icon_url: 'https://raw.githubusercontent.com/Sonarr/Sonarr/develop/Logo/64.png'
                }
            };

            // Log de succès
            client.logger.info(`Notification Sonarr [${eventType}] traitée avec succès pour: ${seriesInfo.title}${episodeInfo ? ` - ${episodeInfo.seasonNumber}${episodeInfo.episodeNumber}` : ''}`);

            return embed;

        } catch (error) {
            client.logger.error(`Erreur lors du traitement de la notification Sonarr: ${error.message}`, {
                stack: error.stack,
                payload: payload ? JSON.stringify(payload, null, 2) : 'undefined'
            });
            return null;
        }
    }
}

module.exports = new SonarrHandler();