const { AttachmentBuilder } = require('discord.js');
const config = require('../config');

class NotificationService {
    /**
     * Envoie le JSON brut pour le debug (Serveur Admin)
     * Utilise une récupération robuste (Cache + Fetch)
     */
    static async sendRawLog(client, source, payload) {
        try {
            const adminGuildId = config.guild.admin;
            const logChannelId = config.channels.debug;

            if (!logChannelId) return;

            // 1. Récupération robuste de la Guild Admin
            let adminGuild = client.guilds.cache.get(adminGuildId) 
                || await client.guilds.fetch(adminGuildId).catch(() => null);

            if (!adminGuild) {
                return client.logger.error(`[DebugLog] Serveur admin introuvable (${adminGuildId})`);
            }

            // 2. Récupération robuste du Canal de Log
            let logChannel = adminGuild.channels.cache.get(logChannelId)
                || await adminGuild.channels.fetch(logChannelId).catch(() => null);

            if (!logChannel) {
                return client.logger.error(`[DebugLog] Canal debug introuvable (${logChannelId})`);
            }

            // 3. Préparation et envoi du fichier
            const buffer = Buffer.from(JSON.stringify(payload, null, 2));
            const attachment = new AttachmentBuilder(buffer, { 
                name: `debug_${source}_${Date.now()}.json` 
            });

            await logChannel.send({
                content: `🛠️ **Debug Payload** | Source: \`${source.toUpperCase()}\` | <t:${Math.floor(Date.now() / 1000)}:f>`,
                files: [attachment]
            });

        } catch (error) {
            client.logger.error(`Erreur critique dans sendRawLog: ${error.message}`);
        }
    }

    /**
     * Envoi global vers tous les serveurs abonnés
     */
    static async sendNotificationToAll(client, source, embedData, payload = null, options = {}) {
        const results = { success: [], failed: [], totalSent: 0 };

        // 1. Log du JSON brut en priorité
        if (payload) {
            await this.sendRawLog(client, source, payload);
        }

        // 2. Récupération des associations depuis la DB
        const associations = client.settings.getWebhookSource(source) || {};

        for (const [guildId, data] of Object.entries(associations)) {
            try {
                const guild = client.guilds.cache.get(guildId);
                // Note: Pour le broadcast massif, on reste sur le cache pour éviter les Rate Limits
                const channel = guild?.channels.cache.get(data.channelId);

                if (!channel) {
                    results.failed.push(`${data.guildName || guildId}: Canal/Serveur non accessible (Cache)`);
                    continue;
                }

                await channel.send({ embeds: [embedData] });
                results.success.push(`${data.guildName} - #${data.channelName}`);
                results.totalSent++;

            } catch (error) {
                results.failed.push(`${data.guildName || guildId}: ${error.message}`);
            }
        }

        // 3. Notification récapitulative pour les Admins
        await this.sendToAdmin(client, source, embedData, results.totalSent, options.includeAdminInfo);

        return results;
    }

    /**
     * Envoie l'embed au canal de notification admin (Cache + Fetch)
     */
    static async sendToAdmin(client, source, embedData, totalSent, includeInfo = true) {
        try {
            const adminGuildId = config.guild.admin;
            const adminChannelId = config.channels.notifications || config.channels.default;

            let adminGuild = client.guilds.cache.get(adminGuildId) 
                || await client.guilds.fetch(adminGuildId).catch(() => null);

            if (!adminGuild) return;

            let channel = adminGuild.channels.cache.get(adminChannelId)
                || await adminGuild.channels.fetch(adminChannelId).catch(() => null);

            if (!channel) return;

            // Clone l'embed pour ne pas modifier l'original envoyé aux autres serveurs
            const adminEmbed = { ...embedData };

            if (includeInfo) {
                const footerText = `[${source.toUpperCase()}] Diffusion : ${totalSent} serveur(s)`;
                adminEmbed.footer = {
                    text: embedData.footer?.text ? `${embedData.footer.text} • ${footerText}` : footerText,
                    icon_url: embedData.footer?.icon_url
                };
            }

            await channel.send({ embeds: [adminEmbed] });

        } catch (e) {
            client.logger.error(`Erreur sendToAdmin: ${e.message}`);
        }
    }
}

module.exports = NotificationService;