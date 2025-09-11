# Spotify API Integration Setup

## 1. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the app details:
   - App name: "K-Pop Playlist App"
   - App description: "A K-pop playlist management app"
   - Website: Your website (optional)
   - Redirect URI: `http://localhost:3000/callback` (for future OAuth)
5. Accept the terms and create the app
6. Copy your **Client ID** and **Client Secret**

## 2. Update Environment Variables

Add these to your `.env` file:

```env
# Spotify API
SPOTIFY_CLIENT_ID="your-spotify-client-id-here"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret-here"
```

## 3. Test the Integration

Once you've added the credentials, restart your server and test:

```bash
# Search for K-pop tracks
curl "http://localhost:3000/songs/spotify/search/kpop?q=BTS&limit=5"

# Get popular K-pop tracks
curl "http://localhost:3000/songs/spotify/popular/kpop?limit=10"

# Search for any tracks
curl "http://localhost:3000/songs/spotify/search?q=blackpink&limit=5"
```

## 4. Features Available

- ✅ Search K-pop tracks from Spotify
- ✅ Get popular K-pop tracks
- ✅ Search any tracks on Spotify
- ✅ Get track details by Spotify ID
- ✅ Save Spotify tracks to your database
- ✅ Add Spotify tracks to playlists

## 5. API Endpoints

### Songs with Spotify Integration:

- `GET /songs/spotify/search?q={query}&limit={limit}` - Search any tracks
- `GET /songs/spotify/search/kpop?q={query}&limit={limit}` - Search K-pop tracks
- `GET /songs/spotify/popular/kpop?limit={limit}` - Get popular K-pop tracks
- `GET /songs/spotify/track/{id}` - Get specific track by Spotify ID

### Direct Spotify API:

- `GET /spotify/search?q={query}&limit={limit}` - Direct Spotify search
- `GET /spotify/search/kpop?q={query}&limit={limit}` - Direct K-pop search
- `GET /spotify/popular/kpop?limit={limit}` - Direct popular K-pop
- `GET /spotify/track/{id}` - Direct track lookup
- `GET /spotify/artists/search?q={query}` - Search artists
- `GET /spotify/artists/{id}/top-tracks` - Get artist's top tracks
