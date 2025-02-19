const ApiService = require("./apiService");
const config = require("../config");

class RadarrService extends ApiService {
    constructor() {
        super(config.apis.radarr.url, {
            "Content-Type": "application/json",
            "X-Api-Key": config.apis.radarr.token
        });
    }

    async getQueue() {
        return this.get(`/api/v3/queue`, {
            page: "1",
        });
    }
}

module.exports = RadarrService;
