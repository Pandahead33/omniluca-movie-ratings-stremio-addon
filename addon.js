
const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
require('dotenv').config();

const manifest = {
    "id": "org.stremio.omnilucaratings.v2",
    "version": "1.0.5",
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

                // Using spaces instead of newlines for title to ensure single-line display compatibility
                ratingsText += `${emoji} ${source}: ${value}   `;
            });
        } else {
            ratingsText = "No ratings available";
        }

        const stream = {
            title: ratingsText,
            url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Test with REAL video
            name: "OmniLuca Ratings",
            description: data.Plot || ""
        };

        return { streams: [stream] };

    } catch (error) {
        console.error("Error fetching from OMDb:", error.message);
        return { streams: [{ title: `Internal Error: ${error.message}` }] };
    }
});

module.exports = builder.getInterface();
