# Stremio Ratings Addon

A Stremio addon that displays ratings from IMDb, Rotten Tomatoes, and Metacritic using the OMDb API.

## Setup

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Get an OMDb API Key**: Sign up at [omdbapi.com](https://www.omdbapi.com/apikey.aspx) (Free tier: 1,000 requests/day).
4.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```
    OMDB_API_KEY=your_api_key_here
    PORT=7000
    ```

## Running Locally

To run the addon locally:

```bash
npm start
```

Access the addon at `http://127.0.0.1:7000/manifest.json`.

## Deployment (Vercel)

This project is configured for deployment on [Vercel](https://vercel.com/).

1.  **Push to GitHub**: Push your code to a GitHub repository.
2.  **Import to Vercel**:
    *   Go to Vercel dashboard.
    *   Click "Add New..." -> "Project".
    *   Import your GitHub repository.
3.  **Configure Environment Variables**:
    *   In the Vercel project settings, add `OMDB_API_KEY` with your key.
4.  **Deploy**: Click "Deploy".
5.  **Use**: Once deployed, copy the URL (e.g., `https://your-project.vercel.app/manifest.json`) and paste it into Stremio's search bar or Addon manager.

## Troubleshooting

*   **Ratings not showing?** Verify your OMDb API key is valid and has not exceeded the daily limit.
*   **"Internal Server Error" on Vercel?** Check the function logs in Vercel. ensure `OMDB_API_KEY` is set correctly.
