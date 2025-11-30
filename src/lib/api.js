import { mockChart, mockNewReleases, mockSearchResults } from './mockData';

const API_BASE = '/api/proxy';
const DEEZER_API = 'https://api.deezer.com';

const fetchFromApi = async (params) => {
  if (typeof window !== 'undefined' && window.electron) {
    // Electron Mode: Use IPC
    let url = DEEZER_API;
    if (params.chart) {
      url = `${DEEZER_API}/chart`;
    } else if (params.new_releases) {
      url = `${DEEZER_API}/chart/0/albums`;
    } else if (params.q) {
      if (params.type && ['artist', 'album', 'track'].includes(params.type)) {
        url = `${DEEZER_API}/search/${params.type}?q=${encodeURIComponent(params.q)}`;
      } else {
        url = `${DEEZER_API}/search?q=${encodeURIComponent(params.q)}`;
      }
    } else if (params.artist) {
      url = `${DEEZER_API}/artist/${params.artist}`;
    } else if (params.artist_top) {
      url = `${DEEZER_API}/artist/${params.artist_top}/top?limit=50`;
    }
    return window.electron.proxyDeezer(url);
  } else {
    // Web Mode: Use API Route
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
    const res = await fetch(`${API_BASE}?${searchParams.toString()}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  }
};

export const searchTracks = async (query) => {
  try {
    const data = await fetchFromApi({ q: query, type: 'track' });
    const results = data.data || [];
    if (results.length === 0 && mockSearchResults?.tracks) {
      return mockSearchResults.tracks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));
    }
    return results;
  } catch (error) {
    console.error("Search error:", error);
    return mockSearchResults?.tracks || [];
  }
};

export const searchArtists = async (query) => {
  try {
    const data = await fetchFromApi({ q: query, type: 'artist' });
    const results = data.data || [];
    if (results.length === 0 && mockSearchResults?.artists) {
      return mockSearchResults.artists.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
    }
    return results;
  } catch (error) {
    console.error("Search artists error:", error);
    return mockSearchResults?.artists || [];
  }
};

export const searchAlbums = async (query) => {
  try {
    const data = await fetchFromApi({ q: query, type: 'album' });
    const results = data.data || [];
    if (results.length === 0 && mockSearchResults?.albums) {
      return mockSearchResults.albums.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));
    }
    return results;
  } catch (error) {
    console.error("Search albums error:", error);
    return mockSearchResults?.albums || [];
  }
};

export const getChart = async () => {
  try {
    const data = await fetchFromApi({ chart: true });
    const tracks = data.tracks?.data || [];
    if (tracks.length === 0) return mockChart;
    return tracks;
  } catch (error) {
    console.error("Chart error:", error);
    return mockChart;
  }
};

export const getArtist = async (id) => {
  try {
    return await fetchFromApi({ artist: id });
  } catch (error) {
    console.error("Artist error:", error);
    return null;
  }
};

export const getArtistTopTracks = async (id) => {
  try {
    const data = await fetchFromApi({ artist_top: id });
    return data.data || [];
  } catch (error) {
    console.error("Artist top tracks error:", error);
    return [];
  }
};

export const getNewReleases = async () => {
  try {
    const data = await fetchFromApi({ new_releases: true });
    const albums = data.data || [];
    if (albums.length === 0) return mockNewReleases;
    return albums;
  } catch (error) {
    console.error("New releases error:", error);
    return mockNewReleases;
  }
};
