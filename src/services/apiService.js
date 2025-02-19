const axios = require("axios");
const logger = require('../utils/logger');

class ApiService {
    constructor(baseURL, defaultHeaders = {}) {
        this.client = axios.create({
            baseURL: baseURL,
            headers: defaultHeaders,
        });
    }

    async get(endpoint, params = {}) {
        try {
            const response = await this.client.get(endpoint, { params });
            return response.data;
        } catch (error) {
            logger.error(`Erreur GET ${endpoint}:`, error.message);
            throw error;
        }
    }

    async post(endpoint, data = {}) {
        try {
            const response = await this.client.post(endpoint, data);
            return response.data;
        } catch (error) {
            logger.error(`Erreur POST ${endpoint}:`, error.message);
            throw error;
        }
    }

    async put(endpoint, data = {}) {
        try {
            const response = await this.client.put(endpoint, data);
            return response.data;
        } catch (error) {
            logger.error(`Erreur PUT ${endpoint}:`, error.message);
            throw error;
        }
    }

    async delete(endpoint) {
        try {
            const response = await this.client.delete(endpoint);
            return response.data;
        } catch (error) {
            logger.error(`Erreur DELETE ${endpoint}:`, error.message);
            throw error;
        }
    }
}

module.exports = ApiService;
