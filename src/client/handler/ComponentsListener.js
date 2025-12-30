const { MessageFlags } = require("discord.js");
const DiscordBot = require("../DiscordBot");

class ComponentsListener {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        client.on('interactionCreate', async (interaction) => {
            const checkUserPermissions = async (component) => {
                if (component.options?.public === false && interaction.user.id !== interaction.message.interaction.user.id) {
                    await interaction.reply({
                        content: client.translator.translate("messages.COMPONENT_NOT_PUBLIC", {}, interaction.locale) || "❌ You cannot use this component.",
                        flags: MessageFlags.Ephemeral
                    });

                    return false;
                }

                return true;
            }

            try {
                if (interaction.isButton()) {
                    const component = client.collection.components.buttons.get(interaction.customId);

                    if (!component) return;

                    if (!(await checkUserPermissions(component))) return;

                    try {
                        component.run(client, interaction);
                    } catch (err) {
                        client.logger.error(err);
                    }

                    return;
                }

                if (interaction.isAnySelectMenu()) {
                    const component = client.collection.components.selects.get(interaction.customId);

                    if (!component) return;

                    if (!(await checkUserPermissions(component))) return;

                    try {
                        component.run(client, interaction);
                    } catch (err) {
                        client.logger.error(err);
                    }

                    return;
                }

                if (interaction.isModalSubmit()) {
                    const component = client.collection.components.modals.get(interaction.customId);

                    if (!component) return;

                    try {
                        component.run(client, interaction);
                    } catch (err) {
                        client.logger.error(err);
                    }

                    return;
                }

                if (interaction.isAutocomplete()) {
                    const component = client.collection.components.autocomplete.get(interaction.commandName);

                    if (!component) return;

                    try {
                        component.run(client, interaction);
                    } catch (err) {
                        client.logger.error(err);
                    }

                    return;
                }
            } catch (err) {
                client.logger.error(err);
            }
        });
    }
}

module.exports = ComponentsListener;