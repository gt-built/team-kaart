import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { TeamMember, TeamInfo } from '../types'
import { getTeamColorHex } from '../utils/colors'

// Fix Leaflet's default icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function createCircleIcon(color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: ${color};
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      cursor: pointer;
    "></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

function buildPopupHtml(member: TeamMember, color: string): string {
  const address = [
    `${member.street} ${member.houseNumber}`.trim(),
    `${member.postcode} ${member.city}`.trim(),
  ]
    .filter(Boolean)
    .join('<br/>')

  return `
    <div style="min-width: 180px; font-family: system-ui, sans-serif;">
      <div style="font-size: 15px; font-weight: 700; color: #1a202c; margin-bottom: 4px;">
        ${member.name}
      </div>
      ${member.role ? `<div style="font-size: 13px; color: #4a5568; margin-bottom: 6px;">${member.role}</div>` : ''}
      <div style="font-size: 12px; color: #718096; margin-bottom: 8px; line-height: 1.4;">
        ${address}
      </div>
      ${member.team ? `
        <span style="
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          background-color: ${color};
        ">${member.team}</span>
      ` : ''}
      ${member.category ? `<div style="font-size: 11px; color: #a0aec0; margin-top: 4px;">Categorie ${member.category}</div>` : ''}
    </div>
  `
}

interface MarkersLayerProps {
  members: TeamMember[]
  teams: TeamInfo[]
}

function MarkersLayer({ members, teams }: MarkersLayerProps) {
  const map = useMap()
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.clearLayers()
    } else {
      layerRef.current = L.layerGroup().addTo(map)
    }

    const geocoded = members.filter((m) => m.geocoded && m.lat !== undefined && m.lng !== undefined)

    if (geocoded.length === 0) return

    const bounds: [number, number][] = []

    geocoded.forEach((member) => {
      const color = getTeamColorHex(member.team)
      const icon = createCircleIcon(color)
      const marker = L.marker([member.lat!, member.lng!], { icon })
      marker.bindPopup(buildPopupHtml(member, color), {
        maxWidth: 260,
        className: 'team-popup',
      })
      layerRef.current!.addLayer(marker)
      bounds.push([member.lat!, member.lng!])
    })

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 13 })
    }
  }, [members, teams, map])

  return null
}

interface Props {
  members: TeamMember[]
  teams: TeamInfo[]
}

export default function MapView({ members, teams }: Props) {
  return (
    <MapContainer
      center={[52.0907, 5.1214]}
      zoom={8}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkersLayer members={members} teams={teams} />
    </MapContainer>
  )
}
