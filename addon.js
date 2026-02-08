
const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
require('dotenv').config();

const manifest = {
    "id": "org.stremio.omdbratings",
    "version": "1.0.0",
    "name": "OMDb Ratings",
    "description": "Displays ratings from IMDb, Rotten Tomatoes, and Metacritic using OMDb API.",
    "resources": ["meta"],
    "types": ["movie", "series"],
    "idPrefixes": ["tt"],
    "catalogs": []
};

const builder = new addonBuilder(manifest);

builder.defineResourceHandler("meta", async ({ type, id }) => {
    console.log(`Requesting meta for ${type} ${id}`);

    // Check if ID is likely an IMDb ID (starts with tt)
    if (!id.startsWith("tt")) {
        return { meta: {} }; // OMDb mostly works with IMDb IDs
    }

    try {
        const apiKey = process.env.OMDB_API_KEY;
        if (!apiKey) {
            console.error("OMDb API Key is missing!");
            return { meta: { description: "Error: API Key missing." } };
        }

        const url = `http://www.omdbapi.com/?i=${id}&apikey=${apiKey}&plot=short&r=json`;
        const response = await axios.get(url);
        const data = response.data;

        if (data.Response === "False") {
            console.warn(`OMDb Error for ${id}: ${data.Error}`);
            return { meta: {} };
        }

        // Format ratings
        let description = "";
        if (data.Ratings && data.Ratings.length > 0) {
            description += "⭐ **Ratings:**\n";
            data.Ratings.forEach(rating => {
                let emoji = "📊";
                if (rating.Source === "Internet Movie Database") emoji = "🎥";
                if (rating.Source === "Rotten Tomatoes") emoji = "🍅";
                if (rating.Source === "Metacritic") emoji = "Ⓜ️";

                description += `${emoji} **${rating.Source}**: ${rating.Value}\n`;
            });
            description += "\n";
        }

        description += data.Plot || "";

        const meta = {
            id: id,
            type: type,
            name: data.Title,
            poster: data.Poster !== "N/A" ? data.Poster : null,
            background: data.Poster !== "N/A" ? data.Poster : null, // OMDb doesn't give background, reusing poster
            description: description,
            releaseInfo: data.Year,
            imdbRating: data.imdbRating,
            runtime: data.Runtime,
            language: data.Language,
            country: data.Country,
            director: data.Director,
            cast: data.Actors ? data.Actors.split(", ") : [],
            genres: data.Genre ? data.Genre.split(", ") : []
        };

        return { meta };

    } catch (error) {
        console.error("Error fetching from OMDb:", error.message);
        return { meta: {} };
    }
});

module.exports = builder.getInterface();
