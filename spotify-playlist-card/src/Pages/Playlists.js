import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Playlists.css';
import { FaArrowLeft, FaSearch, FaTimes } from 'react-icons/fa';

const Playlists = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch('https://spotify-backend-w6y3.onrender.com/playlists');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const processedData = data.map(playlist => ({
          ...playlist,
          spotify_url: playlist.spotify_url || `https://open.spotify.com/playlist/${playlist.id}`
        }));
        
        setPlaylists(processedData);
        setFilteredPlaylists(processedData);
      } catch (error) {
        console.error("Error fetching playlists:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  useEffect(() => {
    const filtered = playlists.filter(playlist =>
      playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (playlist.description && playlist.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPlaylists(filtered);
  }, [searchTerm, playlists]);

  if (loading) return <div className="loading">Loading playlists...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="playlists-container">
      <div className="playlists-header">
        <button onClick={() => navigate('/')} className="back-button">
          <FaArrowLeft /> Back
        </button>
        
        <div className="search-wrapper">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <FaSearch className="search-icon" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="clear-search"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="playlist-header">
        <img src="/profile.jpeg" alt="Profile" className="profile-pic" />
        <h1 className="playlist-title">Julio's Playlists</h1>
      </div>

      {searchTerm && (
        <p className="search-results-count">
          Showing {filteredPlaylists.length} of {playlists.length} playlists
        </p>
      )}

      <div className="playlists-grid">
        {filteredPlaylists.length > 0 ? (
          filteredPlaylists.map((playlist) => (
            <div 
              key={playlist.id} 
              className="playlist-card"
              onClick={(e) => {
                // Only navigate if not clicking the Spotify button
                if (!e.target.closest('.spotify-link')) {
                  navigate(`/playlists/${playlist.id}`);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {playlist.image && (
                <img 
                  src={playlist.image} 
                  alt={playlist.name} 
                  className="playlist-image"
                />
              )}
              <h3>{playlist.name}</h3>
              {playlist.description && (
                <p className="playlist-description" style={{ whiteSpace: 'pre-line' }}>
                  {playlist.description}
                </p>
              )}
              <p className="track-count">{playlist.tracks} tracks</p>
              <a 
                href={playlist.spotify_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="spotify-link"
                onClick={(e) => e.stopPropagation()}
              >
                Open in Spotify
              </a>
            </div>
          ))
        ) : (
          <div className="no-results">
            No playlists found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlists;