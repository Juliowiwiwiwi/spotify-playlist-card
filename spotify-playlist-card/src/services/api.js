const API_BASE_URL = "https://spotify-backend-w6y3.onrender.com";

export const fetchPlaylists = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/playlists`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return []; 
  }
};

export const fetchPlaylistTracks = async (playlistId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tracks:', error);
    throw error; // Re-throw to handle in component
  }
};