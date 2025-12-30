class TdarrHandler {
    constructor() {}

    /**
     * Récupère les informations du fichier depuis le payload Tdarr
     * @param {DiscordBot} client - Instance du bot Discord
     * @param {Object} payload - Payload complet de la notification
     * @returns {Object} - Informations du fichier (title, description)
     */
    getFileInfo(client, payload) {
        const { file, originalFilePath, outputFilePath } = payload;
        
        // Extraction du nom de fichier depuis le chemin
        const fileName = originalFilePath ? 
            originalFilePath.split('/').pop().split('\\').pop() : 
            (file || 'Fichier inconnu');

        // Extraction du dossier parent
        const parentDir = originalFilePath ? 
            originalFilePath.split('/').slice(-2, -1)[0] || 
            originalFilePath.split('\\').slice(-2, -1)[0] : 
            '';

        return {
            title: fileName,
            description: parentDir ? `Dossier: ${parentDir}` : 'Traitement de fichier Tdarr'
        };
    }

    /**
     * Construit les champs de l'embed Discord
     * @param {Object} payload - Payload complet de la notification
     * @returns {Array} - Liste des champs pour l'embed
     */
    buildEmbedFields(payload) {
        const fields = [];
        const { 
            originalFilePath, 
            outputFilePath, 
            originalFileSize, 
            outputFileSize,
            processTime,
            worker,
            library,
            error,
            stage,
            percentage,
            eta,
            fps,
            bitrate
        } = payload;

        // Chemin du fichier original
        if (originalFilePath) {
            fields.push({
                name: 'Fichier original',
                value: `\`${originalFilePath.split('/').pop().split('\\').pop()}\``,
                inline: false,
            });
        }

        // Informations sur les tailles de fichier
        if (originalFileSize && outputFileSize) {
            const originalSizeMB = Math.round(originalFileSize / (1024 * 1024));
            const outputSizeMB = Math.round(outputFileSize / (1024 * 1024));
            const reduction = Math.round(((originalFileSize - outputFileSize) / originalFileSize) * 100);
            
            fields.push({
                name: 'Taille',
                value: `${originalSizeMB} MB → ${outputSizeMB} MB ${reduction > 0 ? `(-${reduction}%)` : ''}`,
                inline: true,
            });
        }

        // Temps de traitement
        if (processTime) {
            const hours = Math.floor(processTime / 3600);
            const minutes = Math.floor((processTime % 3600) / 60);
            const seconds = Math.floor(processTime % 60);
            
            fields.push({
                name: 'Durée de traitement',
                value: hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`,
                inline: true,
            });
        }

        // Worker qui a traité le fichier
        if (worker) {
            fields.push({
                name: 'Worker',
                value: worker.toString(),
                inline: true,
            });
        }

        // Bibliothèque
        if (library) {
            fields.push({
                name: 'Bibliothèque',
                value: library,
                inline: true,
            });
        }

        // Progression (pour les tâches en cours)
        if (percentage !== undefined) {
            fields.push({
                name: 'Progression',
                value: `${percentage}%`,
                inline: true,
            });
        }

        // ETA (temps estimé restant)
        if (eta) {
            fields.push({
                name: 'Temps restant estimé',
                value: eta,
                inline: true,
            });
        }

        // FPS et bitrate pour les tâches en cours
        if (fps || bitrate) {
            let value = '';
            if (fps) value += `${fps} FPS`;
            if (fps && bitrate) value += ' • ';
            if (bitrate) value += `${bitrate} kb/s`;
            
            fields.push({
                name: 'Performance',
                value: value,
                inline: true,
            });
        }

        // Erreur si présente
        if (error) {
            fields.push({
                name: 'Erreur',
                value: `\`\`\`${error.substring(0, 200)}${error.length > 200 ? '...' : ''}\`\`\``,
                inline: false,
            });
        }

        return fields;
    }

    /**
     * Détermine la couleur de l'embed selon le type d'événement
     * @param {string} event - Type d'événement Tdarr
     * @returns {number} - Couleur hexadécimale
     */
    getEmbedColor(event) {
        const colorMap = {
            'file_processed': 0x00ff00,        // Vert - Fichier traité avec succès
            'file_processing': 0xffff00,       // Jaune - Fichier en cours de traitement
            'file_error': 0xff0000,            // Rouge - Erreur de traitement
            'file_skipped': 0x808080,          // Gris - Fichier ignoré
            'worker_started': 0x0099ff,        // Bleu - Worker démarré
            'worker_stopped': 0xff6600,        // Orange - Worker arrêté
            'library_scan_complete': 0x00cc99, // Vert clair - Scan terminé
            'health_check': 0x9932cc,          // Violet - Health check
        };

        return colorMap[event] || 0x7289da; // Couleur par défaut (Discord bleu)
    }

    /**
     * Détermine l'icône selon le type d'événement
     * @param {string} event - Type d'événement Tdarr
     * @returns {string} - Emoji ou texte pour l'icône
     */
    getEventIcon(event) {
        const iconMap = {
            'file_processed': '✅',
            'file_processing': '⚙️',
            'file_error': '❌',
            'file_skipped': '⏭️',
            'worker_started': '🚀',
            'worker_stopped': '⏹️',
            'library_scan_complete': '📚',
            'health_check': '🏥',
        };

        return iconMap[event] || '📁';
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

        if (!payload.event) {
            errors.push('Aucun type d\'événement spécifié');
        }

        // Validation spécifique selon le type d'événement
        if (payload.event && payload.event.includes('file_') && !payload.originalFilePath && !payload.file) {
            errors.push('Aucun fichier spécifié pour un événement de fichier');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Détermine si la notification doit être envoyée selon les paramètres de configuration
     * @param {string} event - Type d'événement
     * @param {Object} config - Configuration des notifications
     * @returns {boolean} - True si la notification doit être envoyée
     */
    shouldSendNotification(event, config = {}) {
        // Configuration par défaut
        const defaultConfig = {
            file_processed: true,
            file_processing: false,  // Généralement trop verbeux
            file_error: true,
            file_skipped: false,
            worker_started: false,
            worker_stopped: true,
            library_scan_complete: true,
            health_check: false,
        };

        const notificationConfig = { ...defaultConfig, ...config };
        return notificationConfig[event] !== false;
    }

    /**
     * Fonction principale pour traiter une notification Tdarr
     * @param {DiscordBot} client - Instance du bot Discord
     * @param {string} source - Source de la notification
     * @param {Object} payload - Données reçues du webhook Tdarr
     * @returns {Promise<Object|null>} - Embed Discord ou null en cas d'erreur
     */
    async handleNotification(client, source, payload) {
        try {
            // Validation du payload
            const validation = this.validatePayload(payload);
            if (!validation.isValid) {
                client.logger.error(`Payload Tdarr invalide: ${validation.errors.join(', ')}`);
                return null;
            }

            const { event } = payload;

            // Vérification si la notification doit être envoyée
            if (!this.shouldSendNotification(event, client.config.apis?.tdarr?.notifications)) {
                client.logger.debug(`Notification Tdarr ignorée pour l'événement: ${event}`);
                return null;
            }

            // Récupération des informations du fichier
            const fileInfo = this.getFileInfo(payload);

            // Construction des champs
            const fields = this.buildEmbedFields(payload);

            // Détermination de la couleur et de l'icône
            const color = this.getEmbedColor(event);
            const icon = this.getEventIcon(event);

            // Construction de l'embed
            const embed = {
                author: { 
                    name: `${icon} ${this.translator.translate(`tdarr.event.${event}`, {}, 'fr') || event.replace('_', ' ').toUpperCase()}`
                },
                title: fileInfo.title,
                description: fileInfo.description,
                color: color,
                fields: fields,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Tdarr`,
                    icon_url: 'https://raw.githubusercontent.com/HaveAGitGat/Tdarr/master/images/logo.png'
                }
            };

            // Log de succès
            client.logger.info(`Notification Tdarr traitée avec succès pour: ${fileInfo.title} (${event})`);

            return embed;

        } catch (error) {
            client.logger.error(`Erreur lors du traitement de la notification Tdarr: ${error.message}`, {
                stack: error.stack,
                payload: JSON.stringify(payload, null, 2)
            });
            return null;
        }
    }
}

module.exports = new TdarrHandler();