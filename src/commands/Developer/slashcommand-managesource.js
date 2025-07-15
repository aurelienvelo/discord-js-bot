const { ChatInputCommandInteraction, AttachmentBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const config = require("../../config");

module.exports = new ApplicationCommand({
    command: {
        name: 'managesource',
        description: 'Gérer l\'association d\'une source à un canal.',
        type: 1,
        options: [
            {
                name: 'action',
                description: 'Action à effectuer',
                type: 3, // STRING
                required: true,
                choices: [
                    {
                        name: 'Associer',
                        value: 'associate'
                    },
                    {
                        name: 'Dissocier',
                        value: 'dissociate'
                    }
                ]
            },
            {
                name: 'source',
                description: 'La source à gérer (ex: "github", "twitter").',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Radarr', value: 'radarr' },
                    { name: 'Sonarr', value: 'sonarr' },
                    { name: 'Overseerr', value: 'overseerr' },
                    { name: 'Tdarr', value: 'tdarr' }
                ]
            },
            {
                name: 'channel',
                description: 'Le canal où envoyer les notifications (requis pour l\'association).',
                type: 7, // CHANNEL
                required: false,
                channel_types: [0, 5] // GUILD_TEXT, GUILD_NEWS
            }
        ]
    },
    options: {
        botDevelopers: true
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        // Vérification du rôle autorisé
        const member = interaction.member;

        const authorizedRoleId = config.roles.admin;
        if (!member.roles.cache.has(authorizedRoleId)) {
            return interaction.reply({
                content: `❌ Vous n'avez pas la permission d'utiliser cette commande.`,
                ephemeral: true
            });
        }

        // Récupération des options
        const action = interaction.options.getString('action');
        const source = interaction.options.getString('source');
        const channel = interaction.options.getChannel('channel');

        if (!action || !source) {
            return interaction.reply({
                content: '❌ Veuillez spécifier une action et une source.',
                ephemeral: true
            });
        }

        // Récupération de l'ID du serveur
        const guildId = interaction.guild.id;
        const databaseKey = `webhook-${source}-${guildId}`;

        // Logique en fonction de l'action
        if (action === 'associate') {
            // Association : le canal est requis
            if (!channel) {
                return interaction.reply({
                    content: '❌ Veuillez spécifier un canal pour l\'association.',
                    ephemeral: true
                });
            }

            // Récupération des associations existantes pour cette source
            let sourceAssociations = client.database.get(`webhook-${source}`) || {};
            
            // Ajout/mise à jour de l'association pour ce serveur
            sourceAssociations[guildId] = {
                channelId: channel.id,
                guildName: interaction.guild.name,
                channelName: channel.name
            };

            client.database.set(`webhook-${source}`, sourceAssociations);
            await interaction.reply(`✅ Source **${source}** associée au canal <#${channel.id}> sur ce serveur.`);

        } else if (action === 'dissociate') {
            // Dissociation : vérifier si l'association existe
            const sourceAssociations = client.database.get(`webhook-${source}`) || {};
            
            if (!sourceAssociations[guildId]) {
                return interaction.reply({
                    content: `❌ Aucune association trouvée pour la source **${source}** sur ce serveur.`,
                    ephemeral: true
                });
            }

            const removedChannel = sourceAssociations[guildId];
            delete sourceAssociations[guildId];

            // Si plus d'associations, supprimer complètement l'entrée
            if (Object.keys(sourceAssociations).length === 0) {
                client.database.delete(`webhook-${source}`);
            } else {
                client.database.set(`webhook-${source}`, sourceAssociations);
            }

            await interaction.reply(`✅ Source **${source}** dissociée du canal **${removedChannel.channelName}** sur ce serveur.`);
        }
    }
}).toJSON();