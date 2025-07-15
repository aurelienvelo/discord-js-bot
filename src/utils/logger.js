const { EmbedBuilder } = require("discord.js");
const config = require("../config");
const pino = require('pino');

const baseLogger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

let discordClient = null;

function setDiscordLogging(client) {
  discordClient = client;
}

// Logger enrichi
const logger = {
  info: (...args) => baseLogger.info(...args),
  warn: (...args) => baseLogger.warn(...args),
  debug: (...args) => baseLogger.debug(...args),
  error: async (...args) => {
    baseLogger.error(...args);

    const message = args.map(arg => {
      if (arg instanceof Error) return `${arg.message}\n${arg.stack}`;
      if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
      return String(arg);
    }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🛑 Erreur détectée')
      .setDescription(`\`\`\`\n${message.slice(0, 4000)}\n\`\`\``)
      .setColor(0xff0000)
      .setTimestamp();

    try {
      if (config.channels.logger.enabled) {
        const channel = await discordClient.channels.fetch(config.channels.logger.errorChannelId);
        await channel.send({ embeds: [embed] });
      }
    } catch (e) {
      baseLogger.warn('Erreur lors de l’envoi du log à Discord', e);
    }
  }
};

module.exports = logger;
module.exports.setDiscordLogging = setDiscordLogging;