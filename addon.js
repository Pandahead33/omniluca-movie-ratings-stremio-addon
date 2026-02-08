
const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
require('dotenv').config();

const manifest = {
    "id": "org.stremio.omnilucaratings",
    "version": "1.1.3",
    "name": "OmniLuca Ratings",
    "description": "Displays ratings from IMDb, Rotten Tomatoes, and Metacritic.",
    "resources": ["stream"],
    "types": ["movie", "series"],
    // "idPrefixes": ["tt"], 
    "catalogs": []
};


const builder = new addonBuilder(manifest);

builder.defineResourceHandler("stream", async ({ type, id }) => {
    console.log(`Requesting stream for ${type} ${id}`);

    // Check if ID is likely an IMDb ID (starts with tt)
    if (!id.startsWith("tt")) {
        return { streams: [] };
    }

    try {
        const apiKey = process.env.OMDB_API_KEY;
        if (!apiKey) {
            return { streams: [{ title: "Error: API Key missing" }] };
        }

        const url = `https://www.omdbapi.com/?i=${id}&apikey=${apiKey}&plot=short&r=json`;
        const response = await axios.get(url);
        const data = response.data;

        if (data.Response === "False") {
            return { streams: [{ title: `OMDb Error: ${data.Error}` }] };
        }

        // Format ratings with Conditional Emojis
        let ratingsText = "";

        // Helper to parse rating value to a percentage (0-100)
        const parseRating = (value) => {
            if (value.includes("/")) {
                const parts = value.split("/");
                return (parseFloat(parts[0]) / parseFloat(parts[1])) * 100;
            } else if (value.includes("%")) {
                return parseFloat(value.replace("%", ""));
            }
            return 0;
        };

        if (data.Ratings && data.Ratings.length > 0) {
            data.Ratings.forEach(rating => {
                let source = rating.Source;
                let value = rating.Value;
                const percentage = parseRating(value);

                let emoji = "😐"; // Default Mid (40-59%)
                if (percentage >= 70) emoji = "🔥"; // High (Changed to Fire)
                else if (percentage >= 60) emoji = "👍"; // Good
                else if (percentage < 40) emoji = "💩"; // Low

                if (source === "Internet Movie Database") source = "IMDb";
                if (source === "Rotten Tomatoes") source = "RT";
                if (source === "Metacritic") source = "Meta";

                // key: Use \n to force new lines for "fancy" vertical formatting in one stream
                ratingsText += `${emoji} ${source}: ${value}\n`;
            });
        } else {
            ratingsText = "No ratings available";
        }

        // Add Extra Info (Votes, Awards) instead of Plot
        if (data.imdbVotes && data.imdbVotes !== "N/A") {
            ratingsText += `🗳️ Votes: ${data.imdbVotes}\n`;
        }
        if (data.Awards && data.Awards !== "N/A") {
            // Awards can be long, maybe just check if present or truncate? 
            // OMDb Awards string is usually like "Won 4 Oscars. 42 wins & 80 nominations."
            // Let's just show it, it's usually valuable info.
            ratingsText += `🏆 ${data.Awards}`;
        }

        const stream = {
            title: ratingsText,
            url: "http://127.0.0.1", // Dummy URL
            name: "OmniLuca Ratings"
        };

        return { streams: [stream] };

    } catch (error) {
        console.error("Error fetching from OMDb:", error.message);
        return { streams: [{ title: `Internal Error: ${error.message}` }] };
    }
});

module.exports = builder.getInterface();
