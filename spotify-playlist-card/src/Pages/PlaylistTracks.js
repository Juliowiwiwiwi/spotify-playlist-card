import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PlaylistTracks.css';
import { FaArrowLeft } from 'react-icons/fa';

const PlaylistTracks = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await fetch(`/playlists/${playlistId}/tracks`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received tracks data:', data);
        
        if (!data.items) {
          throw new Error('No tracks found in response');
        }

        setTracks(data.items);
        
      } catch (err) {
        console.error('Fetch tracks error:', err);
        setError(
          err.message.includes('Failed to fetch') 
            ? 'Backend server unavailable. Is it running?' 
            : err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [playlistId]);

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      Loading tracks...
    </div>
  );

  if (error) return (
    <div className="error">
      <p>Error loading tracks: {error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="tracks-container">
      <button onClick={() => navigate(-1)} className="back-button">
        <FaArrowLeft /> Back to Playlists
      </button>
      
      <h2>Playlist Tracks</h2>
      
      {tracks.length > 0 ? (
        <div className="tracks-list">
          {tracks.map(({ track }, index) => (
            <div key={index} className="track-item">
              <div className="track-info">
                <img 
                  src={track.album.images[0]?.url || '/default-track.png'} 
                  alt={track.name}
                  className="track-image"
                />
                <div>
                  <h3>{track.name}</h3>
                  <p>{track.artists.map(a => a.name).join(', ')}</p>
                </div>
              </div>
              {track.preview_url && (
                <audio controls src={track.preview_url} className="audio-player" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-tracks">No tracks available in this playlist</p>
      )}
    </div>
  );
};

export default PlaylistTracks;