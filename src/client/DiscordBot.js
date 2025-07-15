const path = require('path');
const express = require("express");
const config = require("../config");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const CommandsHandler = require("./handler/CommandsHandler");
const CommandsListener = require("./handler/CommandsListener");
const ComponentsHandler = require("./handler/ComponentsHandler");
const ComponentsListener = require("./handler/ComponentsListener");
const EventsHandler = require("./handler/EventsHandler");
const { QuickYAML } = require('quick-yaml.db');
const { handleWebhook } = require('../webhooks');
const TranslationManager = require('../utils/translationManager');
const OverseerrService = require("../services/overseerr");
const RadarrService = require('../services/radarr');
const SonarrService = require('../services/sonarr');
const logger = require("../utils/logger");

class DiscordBot extends Client {
    collection = {
        application_commands: new Collection(),
        message_commands: new Collection(),
        message_commands_aliases: new Collection(),
        components: {
            buttons: new Collection(),
            selects: new Collection(),
            modals: new Collection(),
            autocomplete: new Collection()
        }
    }
    rest_application_commands_array = [];
    login_attempts = 0;
    login_timestamp = 0;
    statusMessages = [
        { name: 'Status 1', type: 4 },
        { name: 'Status 2', type: 4 },
        { name: 'Status 3', type: 4 }
    ];

    commands_handler = new CommandsHandler(this);
    components_handler = new ComponentsHandler(this);
    events_handler = new EventsHandler(this);
    database = new QuickYAML(config.database.path);

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.User
            ],
            presence: {
                activities: [{
                    name: 'keep this empty',
                    type: 4,
                    state: 'DiscordJS-V1.0.0'
                }]
            }
        });

        new CommandsListener(this);
        new ComponentsListener(this);

        this.logger = logger;

        this.translator = new TranslationManager({
            defaultLocale: 'fr',
            fallbackLocale: 'en',
            translationsDir: path.join(path.dirname(__dirname), '/translations'),
            cacheEnabled: true,
            autoReload: true, // Rechargement automatique des fichiers
            logMissingTranslations: true,
            strictMode: false, // true pour lever des erreurs sur les traductions manquantes
            caseSensitive: true,
            logger: this.logger, // Logger personnalisé
        });

        // Configuration du serveur webhook
        this.webhookServer = express();
        this.webhookServer.use(express.json());

        // Routes webhook
        this.webhookServer.post("/webhook/:type", this.handleWebhook.bind(this));
        this.webhookServer.get("/health/status", this.handleHealtchCheck.bind(this));

        // APIs
        this.overseerrService = new OverseerrService();
        this.radarrService = new RadarrService();
        this.sonarrService = new SonarrService();
    }

    async handleWebhook(req, res) {
        const { type } = req.params;
        const data = req.body;

        // Logique du webhook, peut être déléguée à un gestionnaire dédié
        this.logger.info(`Webhook [${type}] reçu : ${JSON.stringify(data)}`);
        await handleWebhook(this, type, data);

        res.status(200).send({ message: "Webhook processed successfully" });
    }

    async handleHealtchCheck(req, res) {
        res.status(200).send({ message: "Ok" });
    }

    startWebhookServer() {
        const PORT = process.env.WEBHOOK_PORT || 3000;

        this.webhookServer.listen(PORT, () => {
            this.logger.info(`Serveur Webhook démarré sur le port ${PORT}`);
        });
    }

    startStatusRotation = () => {
        let index = 0;
        setInterval(() => {
            this.user.setPresence({ activities: [this.statusMessages[index]] });
            index = (index + 1) % this.statusMessages.length;
        }, 4000);
    }

    connect = async () => {
        this.logger.warn(`Attempting to connect to the Discord bot... (${this.login_attempts + 1})`);

        this.login_timestamp = Date.now();

        try {
            await this.login(process.env.CLIENT_TOKEN);
            this.commands_handler.load();
            this.components_handler.load();
            this.events_handler.load();
            this.startStatusRotation();
            this.startWebhookServer();
            this.translator.preloadCache('fr');

            this.logger.warn('Attempting to register application commands... (this might take a while!)');
            await this.commands_handler.registerApplicationCommands(config.development);
            this.logger.info('Successfully registered application commands. For specific guild? ' + (config.development.enabled ? 'Yes' : 'No'));
        } catch (err) {
            this.logger.error('Failed to connect to the Discord bot, retrying...');
            this.logger.error(err);
            this.login_attempts++;
            setTimeout(this.connect, 5000);
        }
    }
}

module.exports = DiscordBot;
