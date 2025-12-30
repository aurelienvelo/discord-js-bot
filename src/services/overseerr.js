const ApiService = require("./apiService");

class OverseerrService extends ApiService {
    constructor(config) {
        super(config.url, {
            "Content-Type": "application/json",
            "X-Api-Key": config.token
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
