const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    PermissionFlagsBits, 
    MessageFlags
} = require("discord.js");
const ApplicationCommand = require("../../structure/ApplicationCommand");

module.exports = new ApplicationCommand({
    command: {
        name: 'settings',
        description: 'Afficher et modifier la configuration du bot sur ce serveur.',
        default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
    },
    options: { 
        botDevelopers: true,
        cooldown: 5000 
    },

    run: async (client, interaction) => {
        const { guild, locale } = interaction;
        
        // Récupération des données actuelles via notre SettingsManager
        const prefix = client.settings.getPrefix(guild.id);
        
        const embed = new EmbedBuilder()
            .setTitle(`Configuration — ${guild.name}`)
            .setColor(client.config.visual?.color || "#5865F2")
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: 'Prefix (Messages)', value: `\`${prefix}\``, inline: true },
                { name: 'Admin Role', value: `<@&${client.config.roles.admin}>`, inline: true }
            )
            .setFooter({ text: "Sélectionnez une option ci-dessous pour modifier un réglage." });

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('settings_select_menu')
                .setPlaceholder('Choisissez un paramètre à modifier...')
                .addOptions([
                    {
                        label: 'Changer le Préfixe',
                        description: 'Modifier le préfixe pour les commandes textuelles.',
                        value: 'set_prefix',
                        emoji: '⌨️'
                    },
                    {
                        label: 'Sources de Notifications',
                        description: 'Voir ou modifier les liaisons Radarr/Sonarr...',
                        value: 'view_sources',
                        emoji: '🔔'
                    }
                ])
        );

        await interaction.reply({ embeds: [embed], components: [menu], flags: MessageFlags.Ephemeral });
    }
}).toJSON();