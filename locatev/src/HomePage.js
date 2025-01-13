import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const API_KEY = 'API_KEY';
  const [searchQuery, setSearchQuery] = useState("");
  const [chargingStations, setChargingStations] = useState([]);
  const [mapError, setMapError] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const currentInfoWindowRef = useRef(null);
  const navigate = useNavigate();

  const pricePoints = [
      1.25, 1.50, 1.75, 2.00, 2.25,
      2.50, 2.75, 3.00, 3.25, 3.50,
      3.75, 4.00, 4.25, 4.50, 4.75,
      1.00, 5.00, 2.15, 3.15, 4.15
  ];

  const createCustomMarker = (color) => {
    // SVG for Google Maps style pin with EV icon
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
        <!-- Pin Shadow -->
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
        </filter>
  
        <!-- Pin Body -->
        <path d="M12 0C5.383 0 0 5.383 0 12c0 9 12 24 12 24s12-15 12-24c0-6.617-5.383-12-12-12z"
              fill="${color}"
              filter="url(#shadow)"/>
  
        <!-- White Circle for Icon -->
        <circle cx="12" cy="12" r="8" fill="white"/>
  
        <!-- EV Charging Icon -->
        <g transform="translate(6,6) scale(0.5)">
          <path d="M19.77 14.33v-2.24L16.44 18h2.33v2.24L22.11 14h-2.34zm2.34-4.33h-8v3.2h2.4v3.2h-4.8V4c0-.53-.43-1-1-1H6c-.53 0-1 .47-1 1v11c0 .53.47 1 1 1h4c.53 0 1-.47 1-1v-3h2l3.2 7h5.6v-2h1.6c.53 0 1-.47 1-1v-6c0-.53-.47-1-1-1z"
                fill="${color}"/>
        </g>
      </svg>`;
  
    // Convert the SVG string to a URL
    const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgString);
    
    return {
      url: svgUrl,
      scaledSize: new window.google.maps.Size(32, 48), // Slightly larger for better visibility
      anchor: new window.google.maps.Point(16, 48), // Bottom center of the pin
    };
  };

  const handlePayment = (stationName, price) => {
    navigate(`/payment?station=${encodeURIComponent(stationName)}&price=${price}`);
};
const getMarkerColor = (price) => {
  if (price <= 2.5) return '#34A853';  // Google Maps green
  if (price <= 3.75) return '#FBBC04'; // Google Maps yellow
  return '#EA4335';                    // Google Maps red
};
  useEffect(() => {
      if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
          setMapError('Please provide a valid API key');
          return;
      }

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
          if (currentInfoWindowRef.current) {
              currentInfoWindowRef.current.close();
          }
      };
  }, []);

  const initMap = () => {
      try {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
              center: { lat: 43.7, lng: -79.4 },
              zoom: 15,
          });

          mapInstanceRef.current.addListener('click', () => {
              if (currentInfoWindowRef.current) {
                  currentInfoWindowRef.current.close();
              }
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
        if (currentInfoWindowRef.current) {
            currentInfoWindowRef.current.close();
        }
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const coordinates = await geocodeLocation(searchQuery);
        if (!coordinates) {
            throw new Error('Location not found');
        }

        mapInstanceRef.current.setCenter(coordinates);
        mapInstanceRef.current.setZoom(15);

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
          const shuffledPrices = [...pricePoints].sort(() => Math.random() - 0.5);

          const stations = data.places.map((place, index) => ({
              name: place.displayName.text,
              address: place.formattedAddress,
              location: {
                  lat: place.location.latitude,
                  lng: place.location.longitude
              },
              price: shuffledPrices[index]
          }));

          setChargingStations(stations);

          stations.forEach(station => {
            const markerColor = getMarkerColor(station.price);
            const marker = new window.google.maps.Marker({
              position: station.location,
              map: mapInstanceRef.current,
              title: station.name,
              icon: createCustomMarker(markerColor),
              animation: window.google.maps.Animation.DROP
            });
          
            // Enhanced InfoWindow style
            const infoWindowContent = `
              <div style="
                padding: 16px;
                border-radius: 8px;
                min-width: 200px;
                max-width: 300px;
              ">
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 8px;
                ">
                  <div style="
                    background-color: ${markerColor};
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <svg width="16" height="16" viewBox="0 0 24 24" style="fill: white">
                      <path d="M19.77 14.33v-2.24L16.44 18h2.33v2.24L22.11 14h-2.34zm2.34-4.33h-8v3.2h2.4v3.2h-4.8V4c0-.53-.43-1-1-1H6c-.53 0-1 .47-1 1v11c0 .53.47 1 1 1h4c.53 0 1-.47 1-1v-3h2l3.2 7h5.6v-2h1.6c.53 0 1-.47 1-1v-6c0-.53-.47-1-1-1z"/>
                    </svg>
                  </div>
                  <h3 style="
                    margin: 0;
                    font-size: 16px;
                    font-weight: 500;
                    color: #202124;
                  ">${station.name}</h3>
                </div>
                <p style="
                  margin: 0 0 12px 0;
                  font-size: 14px;
                  color: #5f6368;
                  line-height: 1.4;
                ">${station.address}</p>
                <p style="
                  margin: 0 0 16px 0;
                  font-size: 16px;
                  font-weight: 500;
                  color: ${markerColor};
                ">
                  $${station.price.toFixed(2)}/hour
                </p>
                <button 
                  onclick="handleInfoWindowPayment('${station.name.replace(/'/g, "\\'")}', ${station.price})"
                  style="
                    background-color: ${markerColor};
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    width: 100%;
                    font-weight: 500;
                    transition: background-color 0.2s;
                  "
                  onmouseover="this.style.backgroundColor='${markerColor}DD'"
                  onmouseout="this.style.backgroundColor='${markerColor}'"
                >
                  Start Charging
                </button>
              </div>
            `;

            window.handleInfoWindowPayment = (stationName, price) => {
              handlePayment(stationName, price);
          };
          
            const infoWindow = new window.google.maps.InfoWindow({
              content: infoWindowContent,
              maxWidth: 300,
            });
          
            
            marker.addListener('click', () => {
              if (currentInfoWindowRef.current) {
                currentInfoWindowRef.current.close();
              }
              infoWindow.open(mapInstanceRef.current, marker);
              currentInfoWindowRef.current = infoWindow;
            });
          
            // Add hover animation
            marker.addListener('mouseover', () => {
              marker.setAnimation(window.google.maps.Animation.BOUNCE);
              setTimeout(() => marker.setAnimation(null), 750);
            });
          
            markersRef.current.push(marker);
          });
      }
  } catch (error) {
      console.error('Error fetching charging stations:', error);
      throw error;
  }
};

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
                    <div className="price-legend">
                        <div className="legend-item">
                            <span className="dot green"></span>Under $2.50/hr
                        </div>
                        <div className="legend-item">
                            <span className="dot yellow"></span>$2.50-$3.75/hr
                        </div>
                        <div className="legend-item">
                            <span className="dot orange"></span>Over $3.75/hr
                        </div>
                    </div>
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
                            <p className={`price ${getMarkerColor(station.price)}`}>
                                ${station.price.toFixed(2)}/hour
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
        </div>
    );
};

export default HomePage;
