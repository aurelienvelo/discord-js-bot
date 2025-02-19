const config = {
    database: {
        path: './database.yml' // The database path.
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
    users: {
        ownerId: '', // The bot owner ID, which is you.
        developers: [''] // The bot developers, remember to include your account ID with the other account IDs.
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
        }
    },
    webhookChannels: {
        alert: "ID_CANAL_ALERT", // The ID CANAL for ALERT
        notification: "ID_CANAL_NOTIFICATION", // The ID CANAL for NOTIFICATION
        overseerr: {
            admin: "",
            channelMapping: {
                TEST_NOTIFICATION: {
                    '': "",
                },
                MEDIA_AUTO_APPROVED: {
                    'Movie Request Automatically Approved': '', // canal activité
                    'Series Request Automatically Approved': ''
                },
                MEDIA_PENDING: {
                    'event_1': '',
                    'event_2': ''
                },
                MEDIA_AVAILABLE: {
                    'Movie Request Now Available': '',
                    'Series Request Now Available': ''
                },
                ISSUE_COMMENT: {
                    'event_3': 'CHANNEL_ID_3'
                },
            },
        },
        radarr: {
            admin: "",
            channelMapping: {
                Radarr: {
                    'Test': "",
                    'MovieFileDelete': "",
                },
            },
        },
        sonarr: {
            admin: "",
            channelMapping: {
                Sonarr: {
                    'Test': "",
                },
            },
        },
        tdarr: "", // The ID CANAL for tdarr app
    },
}

module.exports = config;