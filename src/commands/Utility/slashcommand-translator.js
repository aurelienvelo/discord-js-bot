const config = require("../../config");
const { ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

module.exports = new ApplicationCommand({
    command: {
        name: 'translator',
        description: 'Gérer les traductions du bot!',
        type: 1,
        options: [
            {
                name: 'action',
                description: 'Action à effectuer',
                type: 3, // STRING
                required: true,
                choices: [
                    {
                        name: 'Stats',
                        value: 'stats'
                    },
                    {
                        name: 'Obtenir le rapport des traductions manquantes',
                        value: 'missingReport'
                    },
                    {
                        name: 'Exporter un template pour les traducteurs',
                        value: 'exportTemplate'
                    },
                    {
                        name: 'Obtenir le rapport des fichiers invalides',
                        value: 'invalidReport'
                    },
                    {
                        name: 'Exporter le rapport complet',
                        value: 'fullReport'
                    },
                    {
                        name: 'Pré-charger le cache',
                        value: 'preloadCache'
                    },
                    {
                        name: 'Vider le cache',
                        value: 'clearCache'
                    },
                    {
                        name: 'Vider le cache pour une locale spécifique',
                        value: 'clearCacheForLocale'
                    },
                    {
                        name: 'Recharger les traductions',
                        value: 'reloadTranslations'
                    }
                ]
            },
            {
                name: 'locale',
                description: 'Locale pour certaines actions (par défaut: "fr")',
                type: 3, // STRING
                required: false,
                choices: [
                    {
                        name: 'Français',
                        value: 'fr'
                    },
                    {
                        name: 'Anglais',
                        value: 'en'
                    },
                ]
            }
        ]
    },
    options: {
        cooldown: 5000
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
        if (!action) {
            return interaction.reply({
                content: `❌ Action non spécifiée.`,
                ephemeral: true
            });
        }

        switch (action) {
            case 'stats':
                return interaction.reply({
                    content: `**Statistiques des traductions :**\n\`\`\`json
${JSON.stringify(client.translator.getStats(), null, 2)}
\`\`\``
                });
            case 'missingReport':
                const missingReport = client.translator.getMissingTranslationsReport();
                return interaction.reply({
                    content: `**Rapport des traductions manquantes :**\n\`\`\`json
${JSON.stringify(missingReport, null, 2)}
\`\`\``
                });
            case 'exportTemplate':
                const locale = interaction.options.getString('locale') || 'fr';
                const template = client.translator.exportMissingTranslationsTemplate(locale);
                return interaction.reply({
                    content: `**Template pour les traducteurs (${locale}) :**\n\`\`\`json
${JSON.stringify(template, null, 2)}
\`\`\``
                });
            case 'invalidReport':
                const invalidReport = client.translator.getInvalidTranslationsReport();
                return interaction.reply({
                    content: `**Rapport des fichiers invalides :**\n\`\`\`json
${JSON.stringify(invalidReport, null, 2)}
\`\`\``
                });
            case 'fullReport':
                const fullReport = client.translator.exportFullReport();
                return interaction.reply({
                    content: `**Rapport complet des traductions :**\n\`\`\`json
${JSON.stringify(fullReport, null, 2)}
\`\`\``
                });
            case 'preloadCache':
                const preloadLocale = interaction.options.getString('locale') || 'fr';
                client.translator.preloadCache(preloadLocale);
                return interaction.reply({
                    content: `**Cache préchargé pour la locale \`${preloadLocale}\`**`
                });
            case 'clearCache':
                client.translator.clearCache();
                return interaction.reply({
                    content: `**Cache vidé pour toutes les locales**`
                });
            case 'clearCacheForLocale':
                const clearLocale = interaction.options.getString('locale') || 'fr';
                client.translator.clearCacheForLocale(clearLocale);
                return interaction.reply({
                    content: `**Cache vidé pour la locale \`${clearLocale}\`**`
                });
            case 'reloadTranslations':
                client.translator.reloadTranslations();
                return interaction.reply({
                    content: `**Traductions rechargées avec succès**`
                });
            default:
                return interaction.reply({
                    content: `❌ Action non reconnue.`,
                    ephemeral: true
                });
        }
    }

}).toJSON();