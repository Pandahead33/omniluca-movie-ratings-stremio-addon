
const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
require('dotenv').config();

const manifest = {
    "id": "org.stremio.omdbratings",
    "version": "1.0.0",
    "name": "OMDb Ratings",
    "description": "Displays ratings from IMDb, Rotten Tomatoes, and Metacritic using OMDb API.",
    "resources": ["stream"],
    "types": ["movie", "series"],
    // "idPrefixes": ["tt"], // Removed to allow broader matching, strict prefix might clash with Cinemeta
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

        // Format ratings
        let ratingsText = "";
        if (data.Ratings && data.Ratings.length > 0) {
            data.Ratings.forEach(rating => {
                let source = rating.Source;
                let value = rating.Value;

                if (source === "Internet Movie Database") source = "IMDb";
                if (source === "Rotten Tomatoes") source = "RT";
                if (source === "Metacritic") source = "Meta";

                ratingsText += `${source}: ${value}  `;
            });
        } else {
            ratingsText = "No ratings available";
        }

        const stream = {
            title: `⭐ ${ratingsText} \n${data.Plot || ""}`,
            url: "http://127.0.0.1", // Dummy URL, not playable
            name: "OMDb Ratings"
        };

        return { streams: [stream] };

    } catch (error) {
        console.error("Error fetching from OMDb:", error.message);
        return { streams: [{ title: `Internal Error: ${error.message}` }] };
    }
});

module.exports = builder.getInterface();
