import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PlaylistTracks.css';
import { FaArrowLeft, FaRedo } from 'react-icons/fa';

const PlaylistTracks = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchTracks = useCallback(async (signal) => {
    try {
      console.debug(`[${new Date().toISOString()}] Fetching tracks for playlist:`, playlistId);
      const startTime = performance.now();
      console.log(`Attempting to fetch: https://spotify-backend-w6y3.onrender.com/playlists/${playlistId}/tracks/`);
      const response = await fetch(
        `https://spotify-backend-w6y3.onrender.com/playlists/${playlistId}/tracks/`,
        { signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      const fetchTime = performance.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();
      console.debug(`[${new Date().toISOString()}] Tracks fetched in ${fetchTime.toFixed(0)}ms`, data);

      if (!data?.items?.length) {
        throw new Error('Playlist exists but contains no tracks');
      }

      const validTracks = data.items
        .filter(item => item?.track) // Remove null tracks
        .map(item => ({
          ...item,
          track: {
            ...item.track,
            // Ensure required fields exist
            name: item.track.name || 'Untitled Track',
            artists: item.track.artists || [{ name: 'Unknown Artist' }],
            album: {
              images: item.track.album?.images || []
            }
          }
        }));

      setTracks(validTracks);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Track fetch failed:', {
          error: err,
          playlistId,
          retryCount,
          timestamp: new Date().toISOString()
        });

        setError({
          message: err.message.includes('Failed to fetch')
            ? `Connection failed (Attempt ${retryCount + 1}/3)`
            : err.message,
          isRetryable: retryCount < 2 && !err.message.includes('404')
        });
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [playlistId, retryCount]);

  useEffect(() => {
    const controller = new AbortController();

    fetchTracks(controller.signal);

    return () => controller.abort();
  }, [fetchTracks]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryCount(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  if (loading) return (
    <div className="loading-state">
      <div className="spinner" aria-busy="true" aria-label="Loading tracks" />
      <p>Loading playlist tracks...</p>
      <p className="debug-info">
        Playlist ID: <code>{playlistId}</code>
        {retryCount > 0 && ` | Retry ${retryCount} of 3`}
      </p>
    </div>
  );

  if (error) return (
    <div className="error-state" role="alert">
      <h3>Couldn't load tracks</h3>
      <p>{error.message}</p>

      <div className="action-buttons">
        {error.isRetryable && (
          <button
            onClick={handleRetry}
            className="retry-button"
            aria-label="Retry loading tracks"
          >
            <FaRedo /> Try Again
          </button>
        )}
        <button
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <FaArrowLeft /> Back to Playlists
        </button>
      </div>
    </div>
  );

  return (
    <div className="tracks-view">
      <header className="tracks-header">
        <button
          onClick={() => navigate(-1)}
          className="navigation-button"
          aria-label="Return to playlist list"
        >
          <FaArrowLeft /> Back to Playlists
        </button>
        <h1 className="playlist-title">Playlist Tracks</h1> {/* This is the only heading */}
      </header>

      {/* REMOVED: <h2 className="playlist-tracks-heading">All Tracks</h2> */}

      <div className="tracks-list" aria-live="polite">
        {tracks.map(({ track }, index) => (
          <article
            key={`${track.id}-${index}`}
            className="track-card"
            aria-labelledby={`track-${index}-title`}
          >
            <div className="track-media">
              <img
                src={track.album.images[0]?.url || '/default-track.png'}
                alt=""
                className="track-image"
                onError={(e) => e.target.src = '/default-track.png'}
              />
              {track.preview_url && (
                <audio
                  controls
                  src={track.preview_url}
                  aria-label={`Preview: ${track.name}`}
                  className="audio-preview"
                />
              )}
            </div>

            <div className="track-info">
              <h2 id={`track-${index}-title`} className="track-title">
                {track.name}
              </h2>
              <p className="track-artist">
                {track.artists.map(artist => artist.name).join(', ')}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default PlaylistTracks;