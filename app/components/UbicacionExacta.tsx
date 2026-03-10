"use client"

import { useState, useRef } from "react"
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Autocomplete
} from "@react-google-maps/api"

interface MapSelectorProps {
  onLocationChange: (coords: { lat: number; lng: number }) => void
}

export default function MapSelector({ onLocationChange }: MapSelectorProps) {

  const [shareLocation, setShareLocation] = useState(false)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  })

  const [position, setPosition] = useState({
    lat: 16.756,
    lng: -93.129
  })

  const autocompleteRef = useRef<any>(null)

  const updateLocation = (coords: { lat: number; lng: number }) => {
    setPosition(coords)
    onLocationChange(coords) // send location to parent
  }

  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace()

    if (!place.geometry) return

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()

    updateLocation({ lat, lng })
  }

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {

      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }

      if (coords) {
        setShareLocation(true)
      }

      updateLocation(coords)

    })


  }

  if (!isLoaded) return <p>Loading map...</p>

  return (
    <div className="space-y-4">

      <button
        onClick={detectLocation}
        className="bg-(--pink-50) my-2 px-4 py-2 rounded-lg text-white"
      >
        Detectar mi ubicación
      </button>

      {shareLocation === true ?
      <>
          <Autocomplete
          onLoad={(auto) => (autocompleteRef.current = auto)}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            type="text"
            placeholder="Buscar dirección"
            className="w-full bg-white/5 border border-white/10 p-3 rounded-lg outline-none focus:border-(--pink-75)"
          />
        </Autocomplete>

        <p className="text-(--gray)">Toca el mapa para ajustar el pin sobre tu ubicación real.</p>
        <GoogleMap
          zoom={15}
          center={position}
          mapContainerStyle={{ width: "100%", height: "400px" }}
          onClick={(e) => {

            const coords = {
              lat: e.latLng!.lat(),
              lng: e.latLng!.lng()
            }

            updateLocation(coords)

          }}
        >
          <Marker position={position} />
        </GoogleMap>

        <p className="text-xs text-(--gray-light)">
          Lat: {position.lat.toFixed(5)} | Lng: {position.lng.toFixed(5)}
        </p>
      </> : <></>}

    </div>
  )
}