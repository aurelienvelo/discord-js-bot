const { Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");

module.exports = new MessageCommand({
    command: {
        name: 'help',
        description: 'Replies with a list of available message commands.',
        aliases: ['h']
    },
    options: {
        cooldown: 10000
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {Message} message 
     * @param {string[]} args
     */
    run: async (client, message, args) => {
        const prefix = client.settings.getPrefix(message.guild.id);
        
        const commandList = client.collection.message_commands
            .map((cmd) => `\`${prefix}${cmd.command.name}\``)
            .join(', ');

        await message.reply({
            content: `Mes commandes sur ce serveur : ${commandList}`
        });
    }
}).toJSON();