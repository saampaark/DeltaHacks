import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "./HomePage.css";
import {APIProvider, Map} from '@vis.gl/react-google-maps';

const HomePage = () => {

  const API_KEY= 'AIzaSyCIn1rjggV-44-fFpWN0A4U_-FzaPBuUHE'

  


  return (
    <div className="home-container">
      {/* Search bar */}
      <div className="search-bar">
        <input type="text" placeholder="Search location..." />
        <button>Search</button>
      </div>
      <div id='map'>
      <APIProvider apiKey={API_KEY}>
      <Map
        style={{width: '100vw', height: '100vh'}}
        defaultCenter={{lat: 43.7, lng: -79.4}}
        defaultZoom={3}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      />

      </APIProvider>
      </div>

    </div>
  );
};

export default HomePage;
