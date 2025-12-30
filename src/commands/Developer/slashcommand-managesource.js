const { ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const ApplicationCommand = require("../../structure/ApplicationCommand");

module.exports = new ApplicationCommand({
    command: {
        name: 'managesource',
        description: 'Gérer l\'association d\'une source à un canal.',
        type: 1,
        // On définit la permission par défaut (Gérer le serveur)
        // Les botDevelopers passeront outre grâce à ton handler d'options
        default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
        options: [
            {
                name: 'action',
                description: 'Action à effectuer',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Associer', value: 'associate' },
                    { name: 'Dissocier', value: 'dissociate' }
                ]
            },
            {
                name: 'source',
                description: 'La source à gérer.',
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
                description: 'Le canal de destination (requis pour l\'association).',
                type: 7, // CHANNEL
                required: false,
                channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
            }
        ]
    },
    options: {
        botDevelopers: true 
    },
    /**
     * @param {import("../../client/DiscordBot")} client 
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const action = interaction.options.getString('action');
        const source = interaction.options.getString('source');
        const channel = interaction.options.getChannel('channel');
        const locale = interaction.locale; // Pour les traductions adaptées à l'utilisateur

        // 1. Logique d'Association
        if (action === 'associate') {
            if (!channel) {
                return interaction.reply({
                    content: client.translator.translate('messages.MISSING_CHANNEL', {}, locale) || "❌ Veuillez spécifier un canal.",
                    flags: MessageFlags.Ephemeral
                });
            }

            await client.settings.updateWebhookSource(source, interaction.guild.id, {
                channelId: channel.id,
                guildName: interaction.guild.name,
                channelName: channel.name
            });

            return interaction.reply({
                content: `✅ Source **${source}** associée au canal <#${channel.id}>.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // 2. Logique de Dissociation
        if (action === 'dissociate') {
            const success = await client.settings.deleteWebhookSource(source, interaction.guild.id);

            if (!success) {
                return interaction.reply({
                    content: `❌ Aucune association trouvée pour **${source}** sur ce serveur.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            return interaction.reply({
                content: `✅ Source **${source}** dissociée avec succès.`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}).toJSON();