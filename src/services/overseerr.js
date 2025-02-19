const ApiService = require("./apiService");
const config = require("../config");

class OverseerrService extends ApiService {
    constructor() {
        super(config.apis.overseerr.url, {
            "Content-Type": "application/json",
            "X-Api-Key": config.apis.overseerr.token
        });
    }

    async getMovie(movieId) {
        return this.get(`/api/v1/movie/${movieId}/`, {
            language: "fr",
        });
    }

    async getTv(tvId) {
        return this.get(`/api/v1/tv/${tvId}/`, {
            language: "fr",
        });
    }
}

module.exports = OverseerrService;
