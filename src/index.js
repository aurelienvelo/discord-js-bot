require('dotenv').config();

const DiscordBot = require('./client/DiscordBot');

const client = new DiscordBot();

module.exports = client;

client.connect();

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
