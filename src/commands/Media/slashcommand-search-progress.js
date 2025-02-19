const { ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

module.exports = new ApplicationCommand({
    command: {
        name: 'search-progress',
        description: 'Replies with the list of media progress.',
        type: 1,
        options: []
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
        const movies = await client.radarrService.getQueue();
        const tvs = await client.sonarrService.getQueue();

        await interaction.reply({
            content: `Movies ==> ${JSON.stringify(movies)} - Series ==> ${JSON.stringify(tvs)}`,
            // components: [
            //     {
            //         type: 1,
            //         components: [{
            //             type: 3, // String Select Menu
            //             custom_id: 'example-menu-id',
            //             placeholder: 'Click here to choose an option',
            //             options: [
            //                 { label: 'Banana', value: 'option-banana' },
            //                 { label: 'Orange', value: 'option-orange' },
            //                 { label: 'Apple', value: 'option-apple' },
            //             ]
            //         }]
            //     },
            // ]
        });
    }
}).toJSON();