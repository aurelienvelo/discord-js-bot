const { Message, MessageFlags } = require("discord.js");
const MessageCommand = require("../../structure/MessageCommand");
const ApplicationCommand = require("../../structure/ApplicationCommand");

const application_commands_cooldown = new Map();
const message_commands_cooldown = new Map();

/**
 * 
 * @param {import("discord.js").Interaction} interaction 
 * @param {ApplicationCommand['data']['options']} options 
 * @param {ApplicationCommand['data']['command']} command 
 * @returns {boolean}
 */
const handleApplicationCommandOptions = async (interaction, options, command) => {
    const config = interaction.client.config;
    const userId = interaction.user.id;
    const isOwner = userId === config.client.ownerId;
    const isDeveloper = config.client.developers.includes(userId);

    // 1. Permission Propriétaire
    if (options.botOwner && !isOwner) {
        await interaction.reply({
            content: interaction.client.translator.translate('messages.NOT_BOT_OWNER', {}, interaction.locale),
            flags: MessageFlags.Ephemeral
        });
        return false;
    }

    // 2. Permission Développeurs (Le owner passe car il est dans la liste)
    if (options.botDevelopers && !isDeveloper) {
        await interaction.reply({
            content: interaction.client.translator.translate('messages.NOT_BOT_DEVELOPER', {}, interaction.locale),
            flags: MessageFlags.Ephemeral
        });
        return false;
    }

    // 3. Permission Guild Owner (Le bot owner peut optionnellement bypasser ici aussi)
    if (options.guildOwner && userId !== interaction.guild.ownerId && !isOwner) {
        await interaction.reply({
            content: interaction.client.translator.translate('messages.NOT_GUILD_OWNER', {}, interaction.locale),
            flags: MessageFlags.Ephemeral
        });
        return false;
    }

    if (options.cooldown) {
        const cooldownFunction = () => {
            let data = application_commands_cooldown.get(interaction.user.id);

            data.push(interaction.commandName);

            application_commands_cooldown.set(interaction.user.id, data);

            setTimeout(() => {
                let data = application_commands_cooldown.get(interaction.user.id);

                data = data.filter((v) => v !== interaction.commandName);

                if (data.length <= 0) {
                    application_commands_cooldown.delete(interaction.user.id);
                } else {
                    application_commands_cooldown.set(interaction.user.id, data);
                }
            }, options.cooldown);
        }

        if (application_commands_cooldown.has(interaction.user.id)) {
            let data = application_commands_cooldown.get(interaction.user.id);

            if (data.some((cmd) => cmd === interaction.commandName)) {
                await interaction.reply({
                    content: config.messages.GUILD_COOLDOWN.replace(/%cooldown%/g, options.cooldown / 1000),
                    flags: MessageFlags.Ephemeral
                });

                return false;
            } else {
                cooldownFunction();
            }
        } else {
            application_commands_cooldown.set(interaction.user.id, [interaction.commandName]);
            cooldownFunction();
        }
    }

    return true;
}

/**
 * 
 * @param {Message} message 
 * @param {MessageCommand['data']['options']} options 
 * @param {MessageCommand['data']['command']} command 
 * @returns {boolean}
 */
const handleMessageCommandOptions = async (message, options, command) => {
    if (options.botOwner) {
        if (message.author.id !== config.users.ownerId) {
            await message.reply({
                content: config.messages.NOT_BOT_OWNER
            });

            return false;
        }
    }

    if (options.botDevelopers) {
        if (config.users?.developers?.length > 0 && !config.users?.developers?.includes(message.author.id)) {
            await message.reply({
                content: config.messages.NOT_BOT_DEVELOPER
            });

            return false;
        }
    }

    if (options.guildOwner) {
        if (message.author.id !== message.guild.ownerId) {
            await message.reply({
                content: config.messages.NOT_GUILD_OWNER
            });

            return false;
        }
    }

    if (options.nsfw) {
        if (!message.channel.nsfw) {
            await message.reply({
                content: config.messages.CHANNEL_NOT_NSFW
            });

            return false;
        }
    }

    if (options.cooldown) {
        const cooldownFunction = () => {
            let data = message_commands_cooldown.get(message.author.id);

            data.push(command.name);

            message_commands_cooldown.set(message.author.id, data);

            setTimeout(() => {
                let data = message_commands_cooldown.get(message.author.id);

                data = data.filter((cmd) => cmd !== command.name);

                if (data.length <= 0) {
                    message_commands_cooldown.delete(message.author.id);
                } else {
                    message_commands_cooldown.set(message.author.id, data);
                }
            }, options.cooldown);
        }

        if (message_commands_cooldown.has(message.author.id)) {
            let data = message_commands_cooldown.get(message.author.id);

            if (data.some((v) => v === command.name)) {
                await message.reply({
                    content: config.messages.GUILD_COOLDOWN.replace(/%cooldown%/g, options.cooldown / 1000)
                });

                return false;
            } else {
                cooldownFunction();
            }
        } else {
            message_commands_cooldown.set(message.author.id, [command.name]);
            cooldownFunction();
        }
    }

    return true;
}

module.exports = { handleApplicationCommandOptions, handleMessageCommandOptions }