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
    const currentInfoWindowRef = useRef(null);

    const pricePoints = [
        1.25, 1.50, 1.75, 2.00, 2.25,
        2.50, 2.75, 3.00, 3.25, 3.50,
        3.75, 4.00, 4.25, 4.50, 4.75,
        1.00, 5.00, 2.15, 3.15, 4.15
    ];

    const getMarkerColor = (price) => {
        if (price <= 2.5) return 'green';
        if (price <= 3.75) return 'yellow';
        return 'orange';
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
                        icon: {
                            url: `https://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`
                        }
                    });

                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div style="padding: 10px;">
                                <h3 style="margin: 0 0 5px 0; font-weight: bold;">${station.name}</h3>
                                <p style="margin: 0 0 5px 0;">${station.address}</p>
                                <p style="margin: 0; font-weight: bold; color: ${markerColor === 'yellow' ? '#b8b800' : markerColor};">
                                    $${station.price.toFixed(2)}/hour
                                </p>
                            </div>
                        `
                    });

                    marker.addListener('click', () => {
                        if (currentInfoWindowRef.current) {
                            currentInfoWindowRef.current.close();
                        }
                        infoWindow.open(mapInstanceRef.current, marker);
                        currentInfoWindowRef.current = infoWindow;
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