const ApiService = require("./apiService");
const config = require("../config");

class SonarrService extends ApiService {
    constructor() {
        super(config.apis.sonarr.url, {
            "Content-Type": "application/json",
            "X-Api-Key": config.apis.sonarr.token
        });
    }

    async getQueue() {
        return this.get(`/api/v3/queue`, {
            page: "1",
        });
    }
}

module.exports = SonarrService;
