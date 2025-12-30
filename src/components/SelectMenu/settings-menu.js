const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const Component = require("../../structure/Component");

module.exports = new Component({
    customId: 'settings_select_menu',
    type: 'select',
    run: async (client, interaction) => {
        const choice = interaction.values[0];

        if (choice === 'set_prefix') {
            // Création du Modal (Formulaire surgissant)
            const modal = new ModalBuilder()
                .setCustomId('settings_prefix_modal')
                .setTitle('Changer le Préfixe');

            const prefixInput = new TextInputBuilder()
                .setCustomId('new_prefix_input')
                .setLabel("Nouveau préfixe (max 5 caractères)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: !')
                .setMaxLength(5)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(prefixInput));
            return interaction.showModal(modal);
        }

        if (choice === 'view_sources') {
            const sources = ['radarr', 'sonarr', 'overseerr', 'tdarr'];
            let description = "";

            sources.forEach(s => {
                const data = client.settings.getWebhookSource(s);
                const entry = data[interaction.guildId];
                description += `**${s.toUpperCase()}** : ${entry ? `<#${entry.channelId}>` : '*Non configuré*'}\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle("Canaux de Notifications")
                .setDescription(description)
                .setColor("#5865F2");

            return interaction.update({ embeds: [embed], components: [] });
        }
    }
}).toJSON();