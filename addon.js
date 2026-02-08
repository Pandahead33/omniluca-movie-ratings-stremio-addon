
const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
require('dotenv').config();

const manifest = {
    "id": "org.stremio.omnilucaratings",
    "version": "1.1.0",
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

        const streams = [];

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

        // 1. Add Rating Streams
        if (data.Ratings && data.Ratings.length > 0) {
            data.Ratings.forEach(rating => {
                let source = rating.Source;
                let value = rating.Value;
                const percentage = parseRating(value);

                let emoji = "😐"; // Default Mid (40-59%)
                if (percentage >= 70) emoji = "❤️"; // High
                else if (percentage >= 60) emoji = "👍"; // Good
                else if (percentage < 40) emoji = "💩"; // Low

                // Simplify Source Names for the "Name" column (Left side)
                let shortSource = source;
                if (source === "Internet Movie Database") shortSource = "IMDb";
                if (source === "Rotten Tomatoes") shortSource = "RT";
                if (source === "Metacritic") shortSource = "Meta";

                streams.push({
                    name: shortSource, // Left column
                    title: `${emoji} ${value}`, // Right column
                    url: "http://127.0.0.1" // Dummy URL
                });
            });
        } else {
            streams.push({
                name: "Ratings",
                title: "No ratings available",
                url: "http://127.0.0.1"
            });
        }

        // 2. Add Plot Stream
        if (data.Plot && data.Plot !== "N/A") {
            streams.push({
                name: "Plot",
                title: data.Plot,
                url: "http://127.0.0.1"
            });
        }

        return { streams: streams };

    } catch (error) {
        console.error("Error fetching from OMDb:", error.message);
        return { streams: [{ title: `Internal Error: ${error.message}` }] };
    }
});

module.exports = builder.getInterface();
