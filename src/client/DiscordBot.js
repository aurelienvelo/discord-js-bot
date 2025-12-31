const path = require('path');
const express = require("express");
const config = require("../config");
const { Client, Collection, GatewayIntentBits, Partials, Options } = require("discord.js");
const CommandsHandler = require("./handler/CommandsHandler");
const CommandsListener = require("./handler/CommandsListener");
const ComponentsHandler = require("./handler/ComponentsHandler");
const ComponentsListener = require("./handler/ComponentsListener");
const EventsHandler = require("./handler/EventsHandler");
const { handleWebhook } = require('../webhooks');
const TranslationManager = require('../utils/translationManager');
const SettingsManager = require('../utils/settingsManager');
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
    statusMessages = [];

    commands_handler = new CommandsHandler(this);
    components_handler = new ComponentsHandler(this);
    events_handler = new EventsHandler(this);

    constructor() {
        super({
            // 1. Intents : On garde le strict nécessaire
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
            // 2. Partials : Permet de traiter des événements sur des objets non castés
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.User
            ],
            // 3. Gestion fine du Cache (Optimisation RAM)
            makeCache: Options.cacheWithLimits({
                ...Options.DefaultMakeCacheSettings,
                MessageManager: 10, // On ne garde que les 10 derniers messages par canal
                ThreadManager: 10,
                PresenceManager: 0, // On ignore totalement les présences (jeu, statut)
                ReactionManager: 0, // Les réactions sont traitées via Partials si besoin
                GuildMemberManager: {
                    maxSize: 100, // On ne cache que les membres actifs
                    keepOverLimit: (member) => member.id === this.user?.id,
                },
            }),
            // 4. Sweepers : Nettoyage automatique toutes les heures
            sweepers: {
                ...Options.DefaultSweeperSettings,
                messages: {
                    interval: 3600, // 1 heure
                    lifetime: 1800, // Supprime les messages plus vieux que 30 mins
                },
                users: {
                    interval: 3600,
                    filter: () => (user) => user.id !== this.user?.id, // Ne pas auto-supprimer le bot
                },
            },
            presence: {
                activities: [{
                    name: 'keep this empty',
                    type: 4,
                    state: 'DiscordJS-V1.0.0'
                }]
            }
        });

        // Initialisation de tes propriétés
        this._initProperties();
        
        // Configuration Webhook Express
        this._initWebhookServer();
    }

    _initProperties() {
        this.collection = {
            application_commands: new Collection(),
            message_commands: new Collection(),
            message_commands_aliases: new Collection(),
            components: {
                buttons: new Collection(),
                selects: new Collection(),
                modals: new Collection(),
                autocomplete: new Collection()
            }
        };
        this.rest_application_commands_array = [];
        this.login_attempts = 0;
        this.login_timestamp = 0;
        this.statusMessages = [
            { name: 'Monitoring Media', type: 4 },
            { name: 'System Active', type: 4 },
            { name: 'Ready for Webhooks', type: 4 }
        ];

        this.commands_handler = new CommandsHandler(this);
        this.components_handler = new ComponentsHandler(this);
        this.events_handler = new EventsHandler(this);
        this.config = config;
        this.logger = logger;

        // Initialise le gestionnaire de paramètres
        this.settings = new SettingsManager(this, this.config.database_path);

        // On instancie les services
        this.overseerrService = new OverseerrService(this.config.apis.overseerr);
        this.radarrService = new RadarrService(this.config.apis.radarr);
        this.sonarrService = new SonarrService(this.config.apis.sonarr);

        this.translator = new TranslationManager({
            defaultLocale: 'fr',
            logger: this.logger, // Logger personnalisé
        });

        new CommandsListener(this);
        new ComponentsListener(this);
    }

    _initWebhookServer() {
        this.webhookServer = express();
        this.webhookServer.use(express.json());
        this.webhookServer.post("/webhook/:type", this.handleWebhook.bind(this));
        this.webhookServer.get("/health/status", this.handleHealthCheck.bind(this));
    }

    async handleWebhook(req, res) {
        const { type } = req.params;
        const data = req.body;

        // Log local
        this.logger.info(`Webhook [${type}] reçu.`);

        try {
            // Traitement via ton handler (qui gère maintenant l'envoi et le log admin)
            await handleWebhook(this, type, data);
            res.status(200).send({ status: "success" });
        } catch (error) {
            this.logger.error(`Erreur lors du traitement du webhook ${type}:`, error);
            res.status(500).send({ status: "error", message: error.message });
        }
    }

    async handleHealthCheck(req, res) {
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
