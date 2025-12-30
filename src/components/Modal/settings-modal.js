
const { MessageFlags } = require("discord.js");
const Component = require("../../structure/Component");

module.exports = new Component({
    customId: 'settings_prefix_modal',
    type: 'modal',
    run: async (client, interaction) => {
        const newPrefix = interaction.fields.getTextInputValue('new_prefix_input');
        
        // Sauvegarde via le SettingsManager
        await client.settings.setPrefix(interaction.guildId, newPrefix);

        await interaction.reply({
            content: `✅ Le préfixe a été mis à jour avec succès : \`${newPrefix}\``,
            flags: MessageFlags.Ephemeral
        });
    }
}).toJSON();