# Testing Guide for Spotify Clone

Since the local development environment has issues with `npm`, follow these steps to verify the application once the environment is fixed.

## 1. Environment Setup
- **Fix NPM**: Ensure Node.js is installed and `npm` is in your system PATH.
- **Install Dependencies**: Run `npm install` in the `spotify-app` directory.
- **Start App**: Run `npm run dev`.
- **Verify Health**: Visit `http://localhost:3000/api/health` and check for `{"status":"ok"}`.

## 2. Authentication
- Click "Log in" in the Navbar.
- Select "Continue with Google".
- Verify you are redirected back and your profile picture appears in the Navbar.

## 3. Playback & YouTube Integration
- Search for a song (e.g., "Tarkan").
- Click on a result to play.
- **Verify**:
    - The player bar appears at the bottom.
    - Audio starts playing (from YouTube).
    - Play/Pause, Skip, and Volume controls work.

## 4. Language Support
- Click "Settings" in the user dropdown.
- Change Language to "Türkçe" (or any other).
- **Verify**:
    - Sidebar text changes (Home -> Ana Sayfa).
    - Greetings change (Good morning -> Günaydın).
    - Settings modal text changes.

## 5. Lyrics
- Play a popular English song (e.g., "Adele - Hello").
- Click the "Lyrics" (Mic) icon in the player.
- **Verify**:
    - Lyrics modal opens.
    - Lyrics are fetched and displayed.
    - If not found, a translated error message appears.

## 6. Library & Playlists
- Click "Create Playlist" in the sidebar.
- Click "Import Playlist".
- Paste a list of songs (e.g., "Queen - Bohemian Rhapsody").
- Click "Start Import".
- **Verify**:
    - A new playlist appears in the sidebar.
    - The playlist contains the imported songs.
