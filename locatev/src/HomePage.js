import React, { useState, useEffect, useRef } from "react";
import "./HomePage.css";

const HomePage = () => {
  const API_KEY = 'AIzaSyCIn1rjggV-44-fFpWN0A4U_-FzaPBuUHE';
  const [searchQuery, setSearchQuery] = useState("");
  const [chargingStations, setChargingStations] = useState([]);
  const [mapError, setMapError] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize map
  useEffect(() => {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
      setMapError('Please provide a valid API key');
      return;
    }

    // Load Google Maps Script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = () => setMapError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
      }
    };
  }, []);

  const initMap = () => {
    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 43.7, lng: -79.4 },
        zoom: 12
      });
    } catch (error) {
      setMapError('Error initializing map');
      console.error('Map initialization error:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Geocode the location
      const coordinates = await geocodeLocation(searchQuery);
      if (!coordinates) {
        throw new Error('Location not found');
      }

      // Update map center and zoom
      mapInstanceRef.current.setCenter(coordinates);
      mapInstanceRef.current.setZoom(13);

      // Search for charging stations
      await searchNearbyChargingStations(coordinates);
    } catch (error) {
      setMapError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const geocodeLocation = (address) => {
    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results[0]) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          resolve({ lat, lng });
        } else {
          reject(new Error('Location not found'));
        }
      });
    });
  };

  const searchNearbyChargingStations = async (coordinates) => {
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.location,places.formattedAddress'
        },
        body: JSON.stringify({
          includedTypes: ["electric_vehicle_charging_station"],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: coordinates.lat,
                longitude: coordinates.lng
              },
              radius: 10000
            }
          },
          rankPreference: "DISTANCE"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch charging stations');
      }

      const data = await response.json();
      if (data.places) {
        const stations = data.places.map(place => ({
          name: place.displayName.text,
          address: place.formattedAddress,
          location: {
            lat: place.location.latitude,
            lng: place.location.longitude
          }
        }));

        setChargingStations(stations);

        // Add markers for each station
        stations.forEach(station => {
          const marker = new window.google.maps.Marker({
            position: station.location,
            map: mapInstanceRef.current,
            title: station.name,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
            }
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px;">
                <h3 style="margin: 0 0 5px 0; font-weight: bold;">${station.name}</h3>
                <p style="margin: 0;">${station.address}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });

          markersRef.current.push(marker);
        });
      }
    } catch (error) {
      console.error('Error fetching charging stations:', error);
      throw error;
    }
  };

  if (mapError) {
    return (
      <div className="error-container">
        <p>Error: {mapError}</p>
        <p>Please check your API key configuration in the Google Cloud Console:</p>
        <ul>
          <li>Enable Maps JavaScript API</li>
          <li>Enable Places API</li>
          <li>Enable Geocoding API</li>
          <li>Check API key restrictions</li>
          <li>Verify billing is enabled</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="search-bar">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Enter location (e.g., New York, NY)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Find Charging Stations'}
          </button>
        </form>
      </div>

      {chargingStations.length > 0 && (
        <div className="stations-list">
          <h3>Nearby Charging Stations</h3>
          {chargingStations.map((station, index) => (
            <div
              key={index}
              className="station-item"
              onClick={() => {
                mapInstanceRef.current.setCenter(station.location);
                mapInstanceRef.current.setZoom(15);
              }}
            >
              <h4>{station.name}</h4>
              <p>{station.address}</p>
            </div>
          ))}
        </div>
      )}

      <div ref={mapRef} id="map" style={{ width: '100vw', height: '100vh' }} />
    </div>
  );
};

export default HomePage;
