import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import html 

# Load environment variables
load_dotenv()
app = Flask(__name__)
CORS(app, resources={
    r"/playlists/": {
        "origins": [
            "http://localhost:3000",
            "https://spotify-playlist-cards.netlify.app/"
        ],
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"] # Explicitly allow these
    },
    r"/playlists/*": { # This should cover /playlists/<playlist_id>/tracks
        "origins": [
            "http://localhost:3000",
            "https://spotify-playlist-cards.netlify.app/"
        ],
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"] # Explicitly allow these
    }
})
# Spotify API credentials
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_USER_ID = os.getenv("SPOTIFY_USER_ID")  # Your Spotify username

def get_spotify_token():
    """Get Spotify API access token using Client Credentials flow"""
    url = "https://accounts.spotify.com/api/token"
    payload = {"grant_type": "client_credentials"}
    headers = {
        "Authorization": f"Basic {get_encoded_credentials()}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    response = requests.post(url, data=payload, headers=headers)
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def get_encoded_credentials():
    """Base64 encode client credentials"""
    import base64
    creds = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    return base64.b64encode(creds.encode()).decode()

@app.route("/playlists/", methods=["GET"])
def get_my_playlists():
    """Endpoint to fetch your public playlists"""
    token = get_spotify_token()
    if not token:
        return jsonify({"error": "Could not get access token"}), 500

    url = f"https://api.spotify.com/v1/users/{SPOTIFY_USER_ID}/playlists"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            playlists = response.json().get("items", [])
            
            # Filter and format playlists
            formatted_playlists = []
            for playlist in playlists:
                if playlist['public']:  # Only include public playlists
                    # Get the smallest available image
                    image_url = None
                    if playlist['images']:
                        smallest_image = min(
                            playlist['images'], 
                            key=lambda x: x.get('width', float('inf')))
                        image_url = smallest_image['url']
                    
                    # Ensure we have a valid Spotify URL
                    spotify_url = playlist.get('external_urls', {}).get('spotify')
                    if not spotify_url:
                        spotify_url = f"https://open.spotify.com/playlist/{playlist['id']}"
                    
                    formatted_playlists.append({
                        "id": playlist['id'],
                        "name": playlist['name'],
                        "description": html.unescape(playlist.get('description', '')).replace('\n', ' ').strip(),
                        "image": image_url,
                        "tracks": playlist['tracks']['total'],
                        "spotify_url": spotify_url,
                        "owner": playlist['owner']['display_name']
                    })
            
            return jsonify(formatted_playlists)
        
        return jsonify({
            "error": "Could not fetch playlists",
            "status_code": response.status_code,
            "message": response.text
        }), response.status_code
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "Network error",
            "message": str(e)
        }), 500
    except Exception as e:
        return jsonify({
            "error": "Unexpected error",
            "message": str(e)
        }), 500



@app.route('/playlists/<playlist_id>/tracks/')
def get_playlist_tracks(playlist_id):
    token = get_spotify_token()
    if not token:
        return jsonify({"error": "Authentication failed"}), 401

    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        items = response.json().get('items', [])
        
        formatted_tracks = []
        for item in items:
            track = item.get('track', {})
            if track and track.get('id'):  # Only include tracks with IDs
                formatted_tracks.append({
                    "track": {
                        "id": track.get('id'),
                        "name": track.get('name'),
                        "artists": [{"name": a.get('name')} for a in track.get('artists', [])],
                        "album": {
                            "images": track.get('album', {}).get('images', [])
                        },
                        "preview_url": track.get('preview_url'),
                        "external_urls": track.get('external_urls', {}),
                        "is_playable": track.get('is_playable', False),
                        "is_local": track.get('is_local', False)
                    }
                })
        
        return jsonify({
            "items": formatted_tracks,
            "total": len(formatted_tracks)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
 app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000))) 