const { QuickYAML } = require('quick-yaml.db');
const fs = require('fs');
const path = require('path');

class SettingsManager {
    constructor(client, dbPath) {
        this.client = client;
        this._initDatabase(dbPath);
    }

    _initDatabase(dbPath) {
        const dbDir = path.dirname(dbPath);

        try {
            // 1. Créer le dossier s'il n'existe pas (nécessaire pour le montage de volume OCI)
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // 2. Créer le fichier YAML s'il n'existe pas
            if (!fs.existsSync(dbPath)) {
                // "---" est le marqueur de début de document YAML
                fs.writeFileSync(dbPath, "---\n", 'utf8');
                client.logger.info(`[Database] Nouveau fichier YAML créé : ${dbPath}`);
            }
            // 3. Initialiser la connexion à la base de données YAML
            this.db = new QuickYAML(dbPath);
        } catch (error) {
            client.logger.error(`[Database] Erreur d'initialisation : ${error.message}`);
            process.exit(1); // On arrête le bot si la DB ne peut pas être chargée
        }
    }

    /**
     * Récupère le préfixe pour un serveur donné
     * @param {string} guildId 
     * @returns 
     */
    getPrefix(guildId) {
        // Retourne le préfixe personnalisé ou celui par défaut du config.js
        return this.db.get(`prefix-${guildId}`) || this.client.config.commands.prefix;
    }

    /**
     * Met à jour le préfixe pour un serveur donné
     * @param {string} guildId 
     * @param {string} newPrefix 
     * @returns 
     */
    async setPrefix(guildId, newPrefix) {
        const key = `prefix-${guildId}`;
        
        // Si le nouveau préfixe est le même que celui par défaut, on supprime l'entrée pour gagner de la place
        if (newPrefix === this.client.config.commands.prefix) {
            return this.db.delete(key);
        }
        
        return this.db.set(key, newPrefix);
    }

    /**
     * Récupère toutes les associations pour une source donnée
     */
    getWebhookSource(source) {
        return this.db.get(`webhook-${source}`) || {};
    }

    /**
     * Ajoute ou met à jour une association serveur/canal pour une source
     */
    async updateWebhookSource(source, guildId, { channelId, guildName, channelName }) {
        const key = `webhook-${source}`;
        const current = this.getWebhookSource(source);

        current[guildId] = {
            channelId,
            guildName,
            channelName,
            updatedAt: new Date().toISOString()
        };

        return this.db.set(key, current);
    }

    /**
     * Supprime une association pour un serveur précis
     */
    async deleteWebhookSource(source, guildId) {
        const key = `webhook-${source}`;
        const current = this.getWebhookSource(source);

        if (!current[guildId]) return false;

        delete current[guildId];

        if (Object.keys(current).length === 0) {
            return this.db.delete(key);
        }

        return this.db.set(key, current);
    }
}

module.exports = SettingsManager;