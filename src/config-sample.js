const config = {
    database: {
        path: process.env.DATABASEDIR + '/database.yml' || './database.yml' // The database path.
    },
    development: {
        enabled: true, // If true, the bot will register all application commands to a specific guild (not globally).
        guildId: '',
    },
    commands: {
        prefix: '?', // For message commands, prefix is required. This can be changed by a database.
        message_commands: true, // If true, the bot will allow users to use message (or prefix) commands.
        application_commands: {
            chat_input: true, // If true, the bot will allow users to use chat input (or slash) commands.
            user_context: true, // If true, the bot will allow users to use user context menu commands.
            message_context: true // If true, the bot will allow users to use message context menu commands.
        }
    },
    guild: {
        admin: "" // ID du serveur d'administration du bot
    },
    users: {
        ownerId: '', // The bot owner ID, which is you.
        developers: [''] // The bot developers, remember to include your account ID with the other account IDs.
    },
    roles: {
        admin: '', // The role ID for the bot admin, which is you.
        moderator: '', // The role ID for the bot moderator
    },
    channels: {
        notifications: "", // Canal principal pour les notifications
        default: "",       // Canal par défaut (peut être le même)
        logger: {
            enabled: true, // If true, the bot will log errors to Discord.
            errorChannelId: "DEFAULT_ERROR_CHANNEL_ID", // The channel ID where errors will be logged.
            infoChannelId: "DEFAULT_INFO_CHANNEL_ID", // The channel ID where info logs will be sent.
            debugChannelId: "DEFAULT_DEBUG_CHANNEL_ID" // The channel ID where debug logs will be sent.
        },
    },
    messages: { // Messages configuration for application commands and message commands handler.
        NOT_BOT_OWNER: 'Vous n\'avez pas la permission d\'exécuter cette commande car vous n\'êtes pas mon propriétaire !',
        NOT_BOT_DEVELOPER: 'Vous n\'avez pas la permission d\'exécuter cette commande car vous n\'êtes pas l\'un de mes développeurs !',
        NOT_GUILD_OWNER: 'Vous n\'avez pas la permission d\'exécuter cette commande car vous n\'êtes pas le propriétaire du serveur !',
        CHANNEL_NOT_NSFW: 'Vous ne pouvez pas exécuter cette commande dans un canal non-NSFW !',
        MISSING_PERMISSIONS: 'Vous n\'avez pas la permission d\'exécuter cette commande, permissions manquantes.',
        COMPONENT_NOT_PUBLIC: 'Vous n\'êtes pas l\'auteur de ce bouton !',
        GUILD_COOLDOWN: 'Vous êtes actuellement en période de cooldown, vous pourrez réutiliser cette commande dans \`%cooldown%s\`.'
    },
    apis: {
        overseerr: {
            url: process.env.OVERSEERR_URL || "http:///localhost:5055",
            token: process.env.OVERSEERR_TOKEN || "",
        },
        radarr: {
            url: process.env.RADARR_URL || "http://localhost:7878",
            token: process.env.RADARR_TOKEN || "",
        },
        sonarr: {
            url: process.env.SONARR_URL || "http://localhost:55757",
            token: process.env.SONARR_TOKEN || "",
        },
        tdarr: {
            url: process.env.TDARR_URL || "http://localhost:8265",
            token: process.env.TDARR_TOKEN || "",
            notifications: {
                file_processed: true,     // Succès important
                file_processing: false,   // Évite le spam
                file_error: true,         // Erreurs importantes
                file_skipped: false,      // Généralement pas crucial
                worker_started: false,    // Info système
                worker_stopped: true,     // Peut indiquer un problème
                library_scan_complete: true,
                health_check: false,
            }
        },
        plex: {
            url: process.env.PLEX_URL || "http://localhost:32400",
            token: process.env.PLEX_TOKEN || "", // Plex token for authentication
        }
    },
}

module.exports = config;