import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface GeoJsonDataItem {
  name: string;
  data: any;
}

interface MapboxViewerProps {
  geoJsonDataArray?: GeoJsonDataItem[];
}

const LAYER_COLORS = [
  '#3b82f6', // 蓝色
  '#ef4444', // 红色
  '#10b981', // 绿色
  '#f59e0b', // 橙色
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
  '#06b6d4', // 青色
  '#6366f1', // 靛色
];

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

export default function MapboxViewer({ geoJsonDataArray }: MapboxViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const loadedSourcesRef = useRef<Set<string>>(new Set());

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

  const prevDataRef = useRef<string>('');
  useEffect(() => {
    if (!map.current || !geoJsonDataArray) return;

    // 深度比较：只有内容真正变化时才重新加载
    const currentData = JSON.stringify(geoJsonDataArray.map(d => d.name));
    if (currentData === prevDataRef.current) {
      return;
    }

    prevDataRef.current = currentData;

    const loadData = () => {
      if (!map.current?.isStyleLoaded()) {
        setTimeout(loadData, 200);
        return;
      }

      // 获取所有已存在的图层和数据源
      const existingLayers = map.current!.getStyle().layers || [];
      const existingSourceIds = new Set(Object.keys(map.current!.getStyle().sources || {}));

      // 清除所有旧的相关图层
      existingLayers.forEach((layer: any) => {
        if (layer.id.includes('geojson-') || layer.id.includes('raster-')) {
          try {
            map.current!.removeLayer(layer.id);
          } catch (e) {
            console.warn(`Failed to remove layer ${layer.id}:`, e);
          }
        }
      });

      // 清除所有旧的相关数据源
      existingSourceIds.forEach((sourceId: string) => {
        if (sourceId.includes('geojson-source-') || sourceId.includes('raster-source-')) {
          try {
            map.current!.removeSource(sourceId);
          } catch (e) {
            console.warn(`Failed to remove source ${sourceId}:`, e);
          }
        }
      });

      // 清空跟踪集合
      loadedSourcesRef.current.clear();

      // 收集所有地图边界，以便最后统一缩放
      const allBounds: [[number, number], [number, number]][] = [];

      // 为每个文件添加图层
      geoJsonDataArray?.forEach((item, idx) => {
        if (item.data?.conversion?.type === 'vector' && item.data?.conversion?.data) {
          addGeoJsonLayer(item.data.conversion.data, idx, item.name);
          const bounds = getBounds(item.data.conversion.data);
          if (bounds) allBounds.push(bounds);
        } else if (item.data?.conversion?.type === 'raster' && item.data?.conversion?.bounds_geojson) {
          addRasterLayer(item.data, idx, item.name);
          const bounds = getBounds(item.data.conversion.bounds_geojson);
          if (bounds) allBounds.push(bounds);
        }
      });

      // 统一缩放到所有数据范围
      if (allBounds.length > 0) {
        const combinedBounds = mergeBounds(allBounds);
        map.current?.fitBounds(combinedBounds, { padding: 50, maxZoom: 15 });
      }
    };

    loadData();
  }, [geoJsonDataArray]);

  const addGeoJsonLayer = (geojson: any, index: number, fileName: string) => {
    if (!map.current || !geojson?.features?.length) return;

    const sourceId = `geojson-source-${index}`;
    const layerId = `geojson-layer-${index}`;
    const outlineId = `geojson-outline-${index}`;
    const color = LAYER_COLORS[index % LAYER_COLORS.length];

    // 检查数据源是否已存在
    if (loadedSourcesRef.current.has(sourceId)) {
      console.warn(`Source ${sourceId} already loaded, skipping...`);
      return;
    }

    // 添加数据源
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
    });

    const geometryType = geojson.features[0]?.geometry?.type;

    if (geometryType?.includes('Point')) {
      map.current.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 8,
          'circle-color': color,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.8,
        },
      });

      // 添加悬停效果
      map.current.on('mouseenter', layerId, () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', layerId, () => {
        map.current!.getCanvas().style.cursor = '';
      });

      // 点击显示文件名
      map.current.on('click', layerId, (e) => {
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<div class="text-sm font-medium">${fileName}</div>`)
          .addTo(map.current!);
      });

    } else if (geometryType?.includes('LineString')) {
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': 3,
          'line-opacity': 0.8,
        },
      });

    } else if (geometryType?.includes('Polygon')) {
      // 填充面
      map.current.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': color,
          'fill-opacity': 0.3,
        },
      });

      // 边框线
      map.current.addLayer({
        id: outlineId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': 2,
          'line-opacity': 0.8,
        },
      });

      // 悬停时加深颜色
      map.current.on('mouseenter', layerId, () => {
        map.current!.setPaintProperty(layerId, 'fill-opacity', 0.6);
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', layerId, () => {
        map.current!.setPaintProperty(layerId, 'fill-opacity', 0.3);
        map.current!.getCanvas().style.cursor = '';
      });

      // 点击显示文件名
      map.current.on('click', layerId, (e) => {
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<div class="text-sm font-medium">${fileName}</div>`)
          .addTo(map.current!);
      });
    }
  };

  const addRasterLayer = async (fileData: any, index: number, fileName: string) => {
    if (!map.current || !fileData?.fileUrl) return;

    const sourceId = `raster-source-${index}`;
    const layerId = `raster-layer-${index}`;

    if (loadedSourcesRef.current.has(sourceId)) return;

    if (fileData.conversion.type === "raster" && fileData.conversion.has_png) {
      // png路径
      const imageUrl = `${fileData.fileUrl.replace(/\.(tif|tiff|geotiff)$/i, ".png")}`;

      // 精准坐标
      const [minX, minY, maxX, maxY] = fileData.conversion.metadata.bounds;

      // 添加图像源
      map.current.addSource(sourceId, {
        type: "image",
        url: imageUrl,
        coordinates: [
          [minX, maxY], // 左上
          [maxX, maxY], // 右上
          [maxX, minY], // 右下
          [minX, minY], // 左下
        ],
      });

      // 添加图像图层
      map.current.addLayer(
        {
          id: layerId,
          type: "raster",
          source: sourceId,
          paint: {
            "raster-opacity": 1.0,
          },
        },
        // 把栅格图层放在矢量图层下面
        // map.current.getStyle().layers?.[0]?.id,
      );

      map.current.fitBounds([[minX, minY], [maxX, maxY]]);
      loadedSourcesRef.current.add(sourceId);
    }
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

  const mergeBounds = (boundsList: [[number, number], [number, number]][]): [[number, number], [number, number]] => {
    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    boundsList.forEach(([sw, ne]) => {
      minLng = Math.min(minLng, sw[0]);
      minLat = Math.min(minLat, sw[1]);
      maxLng = Math.max(maxLng, ne[0]);
      maxLat = Math.max(maxLat, ne[1]);
    });

    return [[minLng, minLat], [maxLng, maxLat]];
  };
  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}