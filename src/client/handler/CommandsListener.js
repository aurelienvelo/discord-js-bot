const { PermissionsBitField, ChannelType, MessageFlags } = require("discord.js");
const DiscordBot = require("../DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const { handleMessageCommandOptions, handleApplicationCommandOptions } = require("./CommandOptions");
const ApplicationCommand = require("../../structure/ApplicationCommand");

class CommandsListener {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        client.on('messageCreate', async (message) => {
            if (message.author.bot || message.channel.type === ChannelType.DM) return;

            const config = message.client.config;

            if (!config.commands.message_commands) return;

            const prefix = client.settings.getPrefix(message.guild.id);

            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/\s+/g);
            const commandInput = args.shift().toLowerCase();

            if (!commandInput.length) return;

            /**
             * @type {MessageCommand['data']}
             */
            const command =
                client.collection.message_commands.get(commandInput) ||
                client.collection.message_commands.get(client.collection.message_commands_aliases.get(commandInput));

            if (!command) return;

            try {
                if (command.options) {
                    const commandContinue = await handleMessageCommandOptions(message, command.options, command.command);

                    if (!commandContinue) return;
                }

                if (command.command?.permissions && !message.member.permissions.has(PermissionsBitField.resolve(command.command.permissions))) {
                    await message.reply({
                        content: client.translator.translate('messages.MISSING_PERMISSIONS', {}, message.locale) || "❌ You don't have the required permissions to use this command.",
                        flags: MessageFlags.Ephemeral
                    });

                    return;
                }

                command.run(client, message, args);
            } catch (err) {
                client.logger.error(err);
            }
        });

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return;

            const config = interaction.client.config;

            if (!config.commands.application_commands.chat_input && interaction.isChatInputCommand()) return;
            if (!config.commands.application_commands.user_context && interaction.isUserContextMenuCommand()) return;
            if (!config.commands.application_commands.message_context && interaction.isMessageContextMenuCommand()) return;

            /**
             * @type {ApplicationCommand['data']}
             */
            const command = client.collection.application_commands.get(interaction.commandName);

            if (!command) return;

            try {
                if (command.options) {
                    const commandContinue = await handleApplicationCommandOptions(interaction, command.options, command.command);

                    if (!commandContinue) return;
                }

                command.run(client, interaction);
            } catch (err) {
                client.logger.error(err);
            }
        });
    }
}

module.exports = CommandsListener;