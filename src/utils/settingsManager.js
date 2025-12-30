class SettingsManager {
    constructor(client, database) {
        this.client = client;
        this.db = database;
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