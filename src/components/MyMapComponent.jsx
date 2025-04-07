import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '500px',
  marginTop: '80px',
  marginBottom: '80px',
};

const center = {
    lat: 28.4790365, // Latitude of Sewa Corporate Park
    lng: 77.0739172  // Longitude of Sewa Corporate Park
  };

const MapComponent = () => {
  const [apiKey, setApiKey] = useState('AIzaSyCSEse36dPHNGGrfasOOQ29wV86CSZuRAE'); // Replace with your API key

  useEffect(() => {
    // Load the API key when the component mounts
    setApiKey('AIzaSyCSEse36dPHNGGrfasOOQ29wV86CSZuRAE'); // Use your actual key here
  }, []);

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
      >
        <Marker position={center} />
      </GoogleMap>
    </LoadScript>
  );
};

export default MapComponent;
