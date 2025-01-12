import React, { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import "./HomePage.css";

const HomePage = () => {
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: 43.7, lng: -79.4 });
  const [zoom, setZoom] = useState(3);
  const API_KEY = 'AIzaSyCIn1rjggV-44-fFpWN0A4U_-FzaPBuUHE';

  const handleSearch = () => {
    const geocoder = new window.google.maps.Geocoder();

    // Use Google Maps Geocoder to get the lat/lng for the search query
    geocoder.geocode({ address: location }, (results, status) => {
      if (status === "OK" && results[0]) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();

        setCoordinates({ lat, lng });
        setZoom(12); // Set zoom level to focus on the location
      } else {
        alert("Location not found!");
      }
    });
  };

  return (
    <div className="home-container">
      {/* Search bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Map container */}
      <div id="map">
        <APIProvider apiKey={API_KEY}>
          <Map
            style={{ width: "100vw", height: "100vh" }}
            center={coordinates}
            zoom={zoom}
            gestureHandling={"greedy"}
            disableDefaultUI={true}
          />
        </APIProvider>
      </div>
    </div>
  );
};

export default HomePage;
