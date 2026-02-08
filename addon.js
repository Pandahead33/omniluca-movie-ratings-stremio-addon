
const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
require('dotenv').config();

const manifest = {
    "id": "org.stremio.omnilucaratings.v2",
    "version": "1.0.3",
    "name": "OmniLuca Ratings V2",
    "description": "Displays ratings from IMDb, Rotten Tomatoes, and Metacritic.",
    "resources": ["stream"],
    "types": ["movie", "series"],
    "idPrefixes": ["tt"],
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
                if (percentage >= 70) emoji = "❤️"; // High
                else if (percentage >= 60) emoji = "👍"; // Good
                else if (percentage < 40) emoji = "💩"; // Low

                if (source === "Internet Movie Database") source = "IMDb";
                if (source === "Rotten Tomatoes") source = "RT";
                if (source === "Metacritic") source = "Meta";

                ratingsText += `${emoji} ${source}: ${value}  \n`; // Newline for better spacing if possible
            });
        } else {
            ratingsText = "No ratings available";
        }

        // Add Plot (Truncated)
        let plot = data.Plot || "";
        if (plot.length > 100) plot = plot.substring(0, 100) + "...";

        const stream = {
            title: ratingsText,
            url: "https://omniluca-movie-ratings-stremio-addo.vercel.app/manifest.json", // Valid external URL
            name: "OmniLuca Ratings",
            description: plot,
            behaviorHints: {
                notWebReady: true, // Signals this isn't a direct playable stream
                bingeGroup: "omniluca-ratings"
            }
        };

        return { streams: [stream] };

    } catch (error) {
        console.error("Error fetching from OMDb:", error.message);
        return { streams: [{ title: `Internal Error: ${error.message}` }] };
    }
});

module.exports = builder.getInterface();
