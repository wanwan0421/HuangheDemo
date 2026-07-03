import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { REMOTE_SENSING_BASE_URL } from '../lib/remoteSensing';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface AirQualityStation {
  stationCode: string;
  stationName: string;
  city: string;
  longitude: number;
  latitude: number;
  controlPoint?: string;
}

interface UnifiedMonitoringMapProps {
  showAirQuality?: boolean;
  showRemoteSensing?: boolean;
  showRunoff?: boolean;
  focusJiyuan?: boolean;
  selectedYear?: number;
  selectedRunoffYear?: number;
  selectedRunoffMonth?: number;
  onStationSelect?: (stationCode: string) => void;
  selectedStationCode?: string;
}

const AIR_QUALITY_BASE_URL = import.meta.env.VITE_BACK_URL?.trim() || '/api';

const BASIN_SOURCE_ID = 'yellow-river-basin-source';
const BASIN_FILL_LAYER_ID = 'yellow-river-basin-fill';
const BASIN_OUTLINE_LAYER_ID = 'yellow-river-basin-outline';
const AIR_SOURCE_ID = 'unified-air-quality-stations-source';
const AIR_LAYER_ID = 'unified-air-quality-stations-layer';
const AIR_SELECTED_LAYER_ID = 'unified-selected-station-layer';
const LANDCOVER_SOURCE_ID = 'unified-landcover-raster-source';
const LANDCOVER_LAYER_ID = 'unified-landcover-raster-layer';
const RUNOFF_SOURCE_ID = 'unified-runoff-raster-source';
const RUNOFF_LAYER_ID = 'unified-runoff-raster-layer';
const JIYUAN_SOURCE_ID = 'jiyuan-boundary-source';
const JIYUAN_FILL_LAYER_ID = 'jiyuan-boundary-fill';
const JIYUAN_OUTLINE_LAYER_ID = 'jiyuan-boundary-outline';

function getLandcoverTileUrl(year: number) {
  const base = REMOTE_SENSING_BASE_URL.endsWith('/')
    ? REMOTE_SENSING_BASE_URL.slice(0, -1)
    : REMOTE_SENSING_BASE_URL;

  return `${base}/landcover/${year}/tiles/{z}/{x}/{y}.png`;
}

function getRunoffTileUrl(year: number, month: number) {
  const base = REMOTE_SENSING_BASE_URL.endsWith('/')
    ? REMOTE_SENSING_BASE_URL.slice(0, -1)
    : REMOTE_SENSING_BASE_URL;

  return `${base}/hydrology/runoff/${year}/${month}/tiles/{z}/{x}/{y}.png`;
}

function getAirQualityUrl(path: string) {
  const base = AIR_QUALITY_BASE_URL.endsWith('/')
    ? AIR_QUALITY_BASE_URL.slice(0, -1)
    : AIR_QUALITY_BASE_URL;

  return `${base}/${path.replace(/^\/+/, '')}`;
}

function getGeoJsonBounds(
  geojson: { features?: Array<{ geometry?: GeoJSON.Geometry | null }> },
): [[number, number], [number, number]] | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const processCoordinates = (coordinates: unknown): void => {
    if (
      Array.isArray(coordinates) &&
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      const [lng, lat] = coordinates;

      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    } else if (Array.isArray(coordinates)) {
      coordinates.forEach(processCoordinates);
    }
  };

  geojson.features?.forEach((feature) => {
    if (feature.geometry && 'coordinates' in feature.geometry) {
      processCoordinates(feature.geometry.coordinates);
    }
  });

  if (
    minLng === Infinity ||
    minLat === Infinity ||
    maxLng === -Infinity ||
    maxLat === -Infinity
  ) {
    return null;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

function setLayerVisibility(
  map: mapboxgl.Map,
  layerId: string,
  visible: boolean,
) {
  if (!map.getLayer(layerId)) {
    return;
  }

  map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

export default function UnifiedMonitoringMap({
  showAirQuality = true,
  showRemoteSensing = false,
  showRunoff = false,
  focusJiyuan = false,
  selectedYear = 2020,
  selectedRunoffYear = 1980,
  selectedRunoffMonth = 1,
  onStationSelect,
  selectedStationCode,
}: UnifiedMonitoringMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const onStationSelectRef = useRef(onStationSelect);
  const selectedStationCodeRef = useRef(selectedStationCode ?? '');
  const basinBoundsRef = useRef<[[number, number], [number, number]] | null>(null);
  const jiyuanBoundsRef = useRef<[[number, number], [number, number]] | null>(null);
  const jiyuanLoadedRef = useRef(false);

  useEffect(() => {
    onStationSelectRef.current = onStationSelect;
  }, [onStationSelect]);

  useEffect(() => {
    selectedStationCodeRef.current = selectedStationCode ?? '';

    const map = mapRef.current;

    if (!map || !map.getLayer(AIR_SELECTED_LAYER_ID)) {
      return;
    }

    map.setFilter(AIR_SELECTED_LAYER_ID, [
      '==',
      ['get', 'stationCode'],
      selectedStationCodeRef.current,
    ]);
  }, [selectedStationCode]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [105, 35],
      zoom: 4,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    });

    map.on('load', async () => {
      try {
        const basinResponse = await fetch('/geojson/yellow_river_basin.geojson');

        if (!basinResponse.ok) {
          throw new Error('Failed to load yellow river basin GeoJSON');
        }

        const basinGeoJson = await basinResponse.json();

        map.addSource(BASIN_SOURCE_ID, {
          type: 'geojson',
          data: basinGeoJson,
        });

        map.addLayer({
          id: BASIN_FILL_LAYER_ID,
          type: 'fill',
          source: BASIN_SOURCE_ID,
          paint: {
            'fill-color': '#f0d776',
            'fill-opacity': 0.14,
          },
        });

        map.addSource(LANDCOVER_SOURCE_ID, {
          type: 'raster',
          tiles: [getLandcoverTileUrl(selectedYear)],
          tileSize: 256,
        });

        map.addLayer({
          id: LANDCOVER_LAYER_ID,
          type: 'raster',
          source: LANDCOVER_SOURCE_ID,
          paint: {
            'raster-opacity': 0.9,
          },
          layout: {
            visibility: showRemoteSensing ? 'visible' : 'none',
          },
        });

        map.addSource(RUNOFF_SOURCE_ID, {
          type: 'raster',
          tiles: [getRunoffTileUrl(selectedRunoffYear, selectedRunoffMonth)],
          tileSize: 256,
        });

        map.addLayer({
          id: RUNOFF_LAYER_ID,
          type: 'raster',
          source: RUNOFF_SOURCE_ID,
          paint: {
            'raster-opacity': 0.9,
          },
          layout: {
            visibility: showRunoff ? 'visible' : 'none',
          },
        });

        map.addLayer({
          id: BASIN_OUTLINE_LAYER_ID,
          type: 'line',
          source: BASIN_SOURCE_ID,
          paint: {
            'line-color': '#111827',
            'line-width': 2.4,
          },
        });

        const bounds = getGeoJsonBounds(basinGeoJson);

        if (bounds) {
          basinBoundsRef.current = bounds;
          map.fitBounds(bounds, {
            padding: 60,
            duration: 1200,
          });
        }
      } catch (error) {
        console.error('Failed to initialize base monitoring map:', error);
      }

      try {
        const stationResponse = await fetch(
          getAirQualityUrl('/huanghe-monitoring/stations'),
        );

        if (!stationResponse.ok) {
          throw new Error('Failed to load air quality stations');
        }

        const stations: AirQualityStation[] = await stationResponse.json();

        const stationGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: 'FeatureCollection',
          features: stations.map((station) => ({
            type: 'Feature',
            properties: {
              stationCode: station.stationCode,
              stationName: station.stationName,
              city: station.city,
              controlPoint: station.controlPoint ?? '',
            },
            geometry: {
              type: 'Point',
              coordinates: [station.longitude, station.latitude],
            },
          })),
        };

        map.addSource(AIR_SOURCE_ID, {
          type: 'geojson',
          data: stationGeoJson,
        });

        map.addLayer({
          id: AIR_LAYER_ID,
          type: 'circle',
          source: AIR_SOURCE_ID,
          paint: {
            'circle-radius': 7,
            'circle-color': '#f97316',
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#fff7ed',
            'circle-opacity': 0.9,
          },
          layout: {
            visibility: showAirQuality ? 'visible' : 'none',
          },
        });

        map.addLayer({
          id: AIR_SELECTED_LAYER_ID,
          type: 'circle',
          source: AIR_SOURCE_ID,
          filter: ['==', ['get', 'stationCode'], selectedStationCodeRef.current],
          paint: {
            'circle-radius': 8,
            'circle-color': '#4491ef',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1,
          },
          layout: {
            visibility: showAirQuality ? 'visible' : 'none',
          },
        });

        map.on('mouseenter', AIR_LAYER_ID, (event) => {
          if (!showAirQuality) {
            return;
          }

          map.getCanvas().style.cursor = 'pointer';

          const feature = event.features?.[0];
          if (!feature || !popupRef.current) {
            return;
          }

          const coordinates = (
            feature.geometry as GeoJSON.Point
          ).coordinates.slice() as [number, number];
          const stationName = feature.properties?.stationName ?? 'Unknown station';
          const city = feature.properties?.city ?? 'Unknown city';

          popupRef.current
            .setLngLat(coordinates)
            .setHTML(
              `<div style="padding: 2px 4px;">
                <div style="font-weight: 700; font-size: 14px; color: #0f172a;">
                  ${stationName}
                </div>
                <div style="margin-top: 4px; font-size: 12px; color: #475569;">
                  所属城市：${city}
                </div>
              </div>`,
            )
            .addTo(map);
        });

        map.on('mouseleave', AIR_LAYER_ID, () => {
          map.getCanvas().style.cursor = '';
          popupRef.current?.remove();
        });

        map.on('click', AIR_LAYER_ID, (event) => {
          if (!showAirQuality) {
            return;
          }

          const feature = event.features?.[0];
          const stationCode = feature?.properties?.stationCode;

          if (!stationCode) {
            return;
          }

          map.setFilter(AIR_SELECTED_LAYER_ID, [
            '==',
            ['get', 'stationCode'],
            stationCode,
          ]);

          onStationSelectRef.current?.(stationCode);
        });
      } catch (error) {
        console.error('Failed to initialize air quality layers:', error);
      }
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    setLayerVisibility(map, AIR_LAYER_ID, showAirQuality);
    setLayerVisibility(map, AIR_SELECTED_LAYER_ID, showAirQuality);

    if (!showAirQuality) {
      popupRef.current?.remove();
      map.getCanvas().style.cursor = '';
    }
  }, [showAirQuality]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    setLayerVisibility(map, LANDCOVER_LAYER_ID, showRemoteSensing);
  }, [showRemoteSensing]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    setLayerVisibility(map, RUNOFF_LAYER_ID, showRunoff);
  }, [showRunoff]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    if (map.getLayer(LANDCOVER_LAYER_ID)) {
      map.removeLayer(LANDCOVER_LAYER_ID);
    }

    if (map.getSource(LANDCOVER_SOURCE_ID)) {
      map.removeSource(LANDCOVER_SOURCE_ID);
    }

    map.addSource(LANDCOVER_SOURCE_ID, {
      type: 'raster',
      tiles: [getLandcoverTileUrl(selectedYear)],
      tileSize: 256,
    });

    map.addLayer(
      {
        id: LANDCOVER_LAYER_ID,
        type: 'raster',
        source: LANDCOVER_SOURCE_ID,
        paint: {
          'raster-opacity': 0.9,
        },
        layout: {
          visibility: showRemoteSensing ? 'visible' : 'none',
        },
      },
      map.getLayer(BASIN_OUTLINE_LAYER_ID) ? BASIN_OUTLINE_LAYER_ID : undefined,
    );
  }, [selectedYear, showRemoteSensing]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    if (map.getLayer(RUNOFF_LAYER_ID)) {
      map.removeLayer(RUNOFF_LAYER_ID);
    }

    if (map.getSource(RUNOFF_SOURCE_ID)) {
      map.removeSource(RUNOFF_SOURCE_ID);
    }

    map.addSource(RUNOFF_SOURCE_ID, {
      type: 'raster',
      tiles: [getRunoffTileUrl(selectedRunoffYear, selectedRunoffMonth)],
      tileSize: 256,
    });

    map.addLayer(
      {
        id: RUNOFF_LAYER_ID,
        type: 'raster',
        source: RUNOFF_SOURCE_ID,
        paint: {
          'raster-opacity': 0.9,
        },
        layout: {
          visibility: showRunoff ? 'visible' : 'none',
        },
      },
      map.getLayer(BASIN_OUTLINE_LAYER_ID) ? BASIN_OUTLINE_LAYER_ID : undefined,
    );
  }, [selectedRunoffYear, selectedRunoffMonth, showRunoff]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const fitToBounds = (
      bounds: [[number, number], [number, number]] | null,
      padding: number,
    ) => {
      if (!bounds) {
        return;
      }

      map.fitBounds(bounds, {
        padding,
        duration: 1000,
      });
    };

    const showJiyuanLayers = () => {
      setLayerVisibility(map, JIYUAN_FILL_LAYER_ID, true);
      setLayerVisibility(map, JIYUAN_OUTLINE_LAYER_ID, true);
      fitToBounds(jiyuanBoundsRef.current, 80);
    };

    if (!focusJiyuan) {
      setLayerVisibility(map, JIYUAN_FILL_LAYER_ID, false);
      setLayerVisibility(map, JIYUAN_OUTLINE_LAYER_ID, false);
      fitToBounds(basinBoundsRef.current, 60);
      return;
    }

    if (jiyuanLoadedRef.current) {
      showJiyuanLayers();
      return;
    }

    const loadJiyuanBoundary = async () => {
      try {
        const response = await fetch('/geojson/jiyuan_boundary.geojson');

        if (!response.ok) {
          throw new Error('Failed to load Jiyuan boundary GeoJSON');
        }

        const jiyuanGeoJson = await response.json();

        if (!map.getSource(JIYUAN_SOURCE_ID)) {
          map.addSource(JIYUAN_SOURCE_ID, {
            type: 'geojson',
            data: jiyuanGeoJson,
          });
        }

        if (!map.getLayer(JIYUAN_FILL_LAYER_ID)) {
          map.addLayer({
            id: JIYUAN_FILL_LAYER_ID,
            type: 'fill',
            source: JIYUAN_SOURCE_ID,
            paint: {
              'fill-color': '#1488bd',
              'fill-opacity': 0.24,
            },
            layout: {
              visibility: 'none',
            },
          });
        }

        if (!map.getLayer(JIYUAN_OUTLINE_LAYER_ID)) {
          map.addLayer({
            id: JIYUAN_OUTLINE_LAYER_ID,
            type: 'line',
            source: JIYUAN_SOURCE_ID,
            paint: {
              'line-color': '#0ee2f6',
              'line-width': 3,
            },
            layout: {
              visibility: 'none',
            },
          });
        }

        jiyuanBoundsRef.current = getGeoJsonBounds(jiyuanGeoJson);
        jiyuanLoadedRef.current = true;
        showJiyuanLayers();
      } catch (error) {
        console.error('Failed to initialize Jiyuan boundary layers:', error);
      }
    };

    void loadJiyuanBoundary();
  }, [focusJiyuan]);

  return (
    <div
      ref={mapContainerRef}
      className="h-full min-h-[720px] w-full overflow-hidden"
    />
  );
}
