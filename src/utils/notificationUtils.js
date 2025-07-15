const config = require('../config');

/**
 * Fonction pour envoyer des notifications à tous les canaux associés + canal par défaut
 * @param {DiscordBot} client - Instance du bot Discord
 * @param {string} source - La source (ex: "github", "twitter")
 * @param {Object} message - L'embed à envoyer
 * @param {Object} options - Options supplémentaires
 */
async function sendNotificationToAll(client, source, message, options = {}) {
    const results = {
        success: [],
        failed: [],
        totalSent: 0
    };

    // 1. Envoi vers tous les serveurs associés à cette source
    const associations = client.database.get(`webhook-${source}`) || {};

    for (const [guildId, data] of Object.entries(associations)) {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                results.failed.push(`Serveur ${data.guildName} (${guildId}) introuvable`);
                continue;
            }

            const channel = guild.channels.cache.get(data.channelId);
            if (!channel) {
                results.failed.push(`Canal ${data.channelName} sur ${data.guildName} introuvable`);
                continue;
            }

            // Envoi du message original (sans info admin)
            await channel.send({ embeds: [message] });
            results.success.push(`${data.guildName} - #${data.channelName}`);
            results.totalSent++;

        } catch (error) {
            results.failed.push(`Erreur sur ${data.guildName}: ${error.message}`);
        }
    }

    // 2. Envoi vers le canal par défaut du serveur d'administration
    try {
        const adminGuildId = config.guild.admin;
        const defaultChannelId = config.channels.notifications || config.channels.default;

        const adminGuild = client.guilds.cache.get(adminGuildId);
        if (adminGuild) {
            const defaultChannel = adminGuild.channels.cache.get(defaultChannelId);
            if (defaultChannel) {
                // Créer l'embed admin avec les informations supplémentaires
                const adminMessage = options.includeAdminInfo ? {
                    ...message, // Copier l'embed original
                    footer: {
                        text: `[${source.toUpperCase()}] Notification envoyée à ${results.totalSent} serveur(s)`,
                        // Si l'embed original a déjà un footer, on le combine
                        ...(message.footer && {
                            text: `${message.footer.text} • [${source.toUpperCase()}] Notification envoyée à ${results.totalSent} serveur(s)`
                        })
                    },
                    // Optionnel: ajouter un timestamp
                    timestamp: new Date().toISOString()
                } : message;

                await defaultChannel.send({ embeds: [adminMessage] });
                results.success.push(`Serveur Admin - Canal par défaut`);
                results.totalSent++;
            } else {
                results.failed.push(`Canal par défaut du serveur admin introuvable`);
            }
        } else {
            results.failed.push(`Serveur d'administration introuvable`);
        }
    } catch (error) {
        results.failed.push(`Erreur serveur admin: ${error.message}`);
    }

    return results;
}

/**
 * Fonction simplifiée pour l'envoi rapide
 * @param {DiscordBot} client - Instance du bot Discord
 * @param {string} source - La source
 * @param {Object} message - L'embed à envoyer
 */
async function sendNotification(client, source, message) {
    return await sendNotificationToAll(client, source, message, { includeAdminInfo: true });
}

/**
 * Fonction pour envoyer uniquement vers le canal par défaut (fallback)
 * @param {DiscordBot} client - Instance du bot Discord
 * @param {string} source - La source
 * @param {Object} message - L'embed à envoyer
 */
async function sendToDefaultChannel(client, source, message) {
    try {
        const adminGuildId = config.guild.admin;
        const defaultChannelId = config.channels.notifications || config.channels.default;

        const adminGuild = client.guilds.cache.get(adminGuildId);
        if (!adminGuild) {
            throw new Error('Serveur d\'administration introuvable');
        }

        const defaultChannel = adminGuild.channels.cache.get(defaultChannelId);
        if (!defaultChannel) {
            throw new Error('Canal par défaut introuvable');
        }

        // Créer un embed avec l'information de source
        const adminEmbed = {
            ...message,
            footer: {
                text: `[${source.toUpperCase()}]`,
                ...(message.footer && {
                    text: `${message.footer.text} • [${source.toUpperCase()}]`
                })
            }
        };

        await defaultChannel.send({ embeds: [adminEmbed] });

        return { success: true, channel: defaultChannel.name };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendNotificationToAll,
    sendNotification,
    sendToDefaultChannel,
};