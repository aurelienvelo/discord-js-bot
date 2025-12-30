const ApiService = require("./apiService");

class RadarrService extends ApiService {
    constructor(config) {
        super(config.url, {
            "Content-Type": "application/json",
            "X-Api-Key": config.token
        });
    }

    async getQueue() {
        return this.get(`/api/v3/queue`, {
            page: "1",
        });
    }
}

module.exports = RadarrService;
