require('dotenv').config();

const ownerId = process.env.OWNER_ID;
const rawDevs = (process.env.DEVELOPER_IDS || '').split(',');

// On crée un tableau propre :
// 1. On ajoute le ownerId au début
// 2. On ajoute les autres devs
// 3. On filtre les chaînes vides et on retire les doublons avec Set
const developersList = [...new Set([ownerId, ...rawDevs])]
    .map(id => id.trim())
    .filter(id => id.length > 0);

module.exports = {
    client: {
        token: process.env.CLIENT_TOKEN,
        ownerId: ownerId,
        developers: developersList, // Contient le owner + les autres devs
    },
    commands: {
        prefix: process.env.COMMAND_PREFIX || '?', 
        message_commands: process.env.ENABLE_MESSAGE_COMMANDS === 'true',
        application_commands: {
            chat_input: process.env.ENABLE_CHAT_INPUT_COMMANDS === 'true', 
            user_context: process.env.ENABLE_USER_CONTEXT_COMMANDS === 'true',
            message_context: process.env.ENABLE_MESSAGE_CONTEXT_COMMANDS === 'true'
        }
    },
    database_path: process.env.DATABASE_PATH || './database.yml',
    guild: {
        admin: process.env.ADMIN_GUILD_ID, // ID du serveur d'administration du bot
    },
    roles: {
        admin: process.env.ROLE_ADMIN,
    },
    channels: {
        notifications: process.env.CHANNEL_NOTIFICATIONS,
        debug: process.env.CHANNEL_DEBUG,
        errors: process.env.CHANNEL_ERRORS,
    },
    apis: {
        overseerr: { url: process.env.OVERSEERR_URL, token: process.env.OVERSEERR_TOKEN },
        radarr: { url: process.env.RADARR_URL, token: process.env.RADARR_TOKEN },
        sonarr: { url: process.env.SONARR_URL, token: process.env.SONARR_TOKEN },
        tdarr: { url: process.env.TDARR_URL, token: process.env.TDARR_TOKEN },
        // ...
    },
    // On garde ici uniquement les paramètres de comportement, pas les IDs
    development: {
        enabled: process.env.NODE_ENV !== 'production',
        guildId: process.env.ADMIN_GUILD_ID,
    }
};