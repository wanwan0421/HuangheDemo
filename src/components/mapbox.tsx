import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxViewerProps {
  geoJsonData?: any;
  rasterUrl?: string;
  fileProfile?: any;
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function MapboxViewer({ geoJsonData, fileProfile }: MapboxViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // 初始化地图
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [104.0, 35.0],
      zoom: 4,
    });

    // 添加导航控件
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const loadData = () => {
      if (!map.current?.isStyleLoaded()) {
        setTimeout(loadData, 200);
        return;
      }

      // 清除已有图层
      ['geojson-layer', 'geojson-outline', 'raster-layer'].forEach(id => {
        if (map.current?.getLayer(id)) map.current.removeLayer(id);
      });
      ['geojson-source', 'raster-source'].forEach(id => {
        if (map.current?.getSource(id)) map.current.removeSource(id);
      });

      // 添加数据
      if (geoJsonData.conversion.type === 'vector') {
        addGeoJsonLayer(geoJsonData.conversion.data);
      }
      if (geoJsonData.conversion.type === 'raster') {
        addRasterLayer(geoJsonData.conversion.bounds_geojson);
      }
    };

    loadData();
  }, [geoJsonData]);

  const addGeoJsonLayer = (geojson: any) => {
    if (!map.current) return;

    map.current.addSource('geojson-source', {
      type: 'geojson',
      data: geojson,
    });

    const geometryType = geojson.features?.[0]?.geometry?.type;

    if (geometryType?.includes('Point')) {
      map.current.addLayer({
        id: 'geojson-layer',
        type: 'circle',
        source: 'geojson-source',
        paint: {
          'circle-radius': 6,
          'circle-color': '#3b82f6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#1e40af',
        },
      });
    } else if (geometryType?.includes('LineString')) {
      map.current.addLayer({
        id: 'geojson-layer',
        type: 'line',
        source: 'geojson-source',
        paint: {
          'line-color': '#ef4444',
          'line-width': 3,
        },
      });
    } else if (geometryType?.includes('Polygon')) {
      map.current.addLayer({
        id: 'geojson-layer',
        type: 'fill',
        source: 'geojson-source',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.4,
        },
      });
      map.current.addLayer({
        id: 'geojson-outline',
        type: 'line',
        source: 'geojson-source',
        paint: {
          'line-color': '#059669',
          'line-width': 2,
        },
      });
    }

    const bounds = getBounds(geojson);
    if (bounds) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  };

  const addRasterLayer = (data: any) => {
    if (!map.current) return;

    map.current.addSource('raster-source', {
      type: 'raster',
      data: data,
    });

    map.current.addLayer({
      id: 'raster-layer',
      type: 'raster',
      source: 'raster-source',
      paint: {
        'raster-opacity': 0.7,
      },
    });
  };

  const getBounds = (geojson: any): [[number, number], [number, number]] | null => {
    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    const processCoords = (coords: any): void => {
      if (typeof coords[0] === 'number') {
        minLng = Math.min(minLng, coords[0]);
        maxLng = Math.max(maxLng, coords[0]);
        minLat = Math.min(minLat, coords[1]);
        maxLat = Math.max(maxLat, coords[1]);
      } else {
        coords.forEach(processCoords);
      }
    };

    geojson.features?.forEach((f: any) => {
      processCoords(f.geometry.coordinates);
    });

    return minLng !== Infinity 
      ? [[minLng, minLat], [maxLng, maxLat]]
      : null;
  };

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
}