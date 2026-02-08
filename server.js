
const { serveHTTP, publishToCentral } = require("stremio-addon-sdk");
const addonInterface = require("./addon");
require('dotenv').config();

const port = process.env.PORT || 7000;

serveHTTP(addonInterface, { port });

// publishToCentral("https://your-addon-url/manifest.json")
//   .then((response) => console.log(response))
//   .catch((e) => console.log(e));

console.log(`Addon active on port ${port}`);
console.log(`http://127.0.0.1:${port}/manifest.json`);
