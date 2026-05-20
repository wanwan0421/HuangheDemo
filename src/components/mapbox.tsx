import { useCallback, useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LngLatBoundsLike, Map as MapboxMap } from "mapbox-gl";

interface GeoJsonDataItem {
  name: string;
  data: any;
}

interface MapboxViewerProps {
  geoJsonDataArray?: GeoJsonDataItem[];
}

type LayerEventHandler = {
  type: string;
  layerId: string;
  handler: (event: any) => void;
};

const LAYER_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
];

let mapboxModulePromise: Promise<typeof import("mapbox-gl")> | null = null;

const loadMapbox = () => {
  if (!mapboxModulePromise) {
    mapboxModulePromise = import("mapbox-gl");
  }
  return mapboxModulePromise;
};

export default function MapboxViewer({ geoJsonDataArray = [] }: MapboxViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxApiRef = useRef<any>(null);
  const renderedRef = useRef<{
    layers: string[];
    sources: string[];
    handlers: LayerEventHandler[];
  }>({ layers: [], sources: [], handlers: [] });
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  const clearRenderedData = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    renderedRef.current.handlers.forEach(({ type, layerId, handler }) => {
      try {
        map.off(type as any, layerId, handler);
      } catch {
        // The layer may have already been removed while the map was re-styling.
      }
    });

    renderedRef.current.layers
      .slice()
      .reverse()
      .forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });

    renderedRef.current.sources.forEach((sourceId) => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    renderedRef.current = { layers: [], sources: [], handlers: [] };
  }, []);

  const registerLayer = useCallback((layerId: string) => {
    renderedRef.current.layers.push(layerId);
  }, []);

  const registerSource = useCallback((sourceId: string) => {
    renderedRef.current.sources.push(sourceId);
  }, []);

  const addLayerEvent = useCallback(
    (type: string, layerId: string, handler: (event: any) => void) => {
      const map = mapRef.current;
      if (!map) return;

      map.on(type as any, layerId, handler);
      renderedRef.current.handlers.push({ type, layerId, handler });
    },
    [],
  );

  const addGeoJsonLayer = useCallback(
    (geojson: any, index: number, fileName: string) => {
      const map = mapRef.current;
      const mapboxgl = mapboxApiRef.current;
      if (!map || !mapboxgl || !geojson?.features?.length) return null;

      const sourceId = `geojson-source-${index}`;
      const layerId = `geojson-layer-${index}`;
      const outlineId = `geojson-outline-${index}`;
      const color = LAYER_COLORS[index % LAYER_COLORS.length];
      const geometryType = geojson.features[0]?.geometry?.type;

      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
      });
      registerSource(sourceId);

      if (geometryType?.includes("Point")) {
        map.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": 8,
            "circle-color": color,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.85,
          },
        });
        registerLayer(layerId);

        addLayerEvent("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        addLayerEvent("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
        addLayerEvent("click", layerId, (event) => {
          new mapboxgl.Popup()
            .setLngLat(event.lngLat)
            .setHTML(`<div class="text-sm font-medium">${escapeHtml(fileName)}</div>`)
            .addTo(map);
        });
      } else if (geometryType?.includes("LineString")) {
        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": color,
            "line-width": 3,
            "line-opacity": 0.85,
          },
        });
        registerLayer(layerId);
      } else if (geometryType?.includes("Polygon")) {
        map.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": color,
            "fill-opacity": 0.28,
          },
        });
        registerLayer(layerId);

        map.addLayer({
          id: outlineId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": color,
            "line-width": 2,
            "line-opacity": 0.9,
          },
        });
        registerLayer(outlineId);

        addLayerEvent("mouseenter", layerId, () => {
          map.setPaintProperty(layerId, "fill-opacity", 0.5);
          map.getCanvas().style.cursor = "pointer";
        });
        addLayerEvent("mouseleave", layerId, () => {
          map.setPaintProperty(layerId, "fill-opacity", 0.28);
          map.getCanvas().style.cursor = "";
        });
        addLayerEvent("click", layerId, (event) => {
          new mapboxgl.Popup()
            .setLngLat(event.lngLat)
            .setHTML(`<div class="text-sm font-medium">${escapeHtml(fileName)}</div>`)
            .addTo(map);
        });
      }

      return getBounds(geojson);
    },
    [addLayerEvent, registerLayer, registerSource],
  );

  const addRasterLayer = useCallback(
    (fileData: any, index: number) => {
      const map = mapRef.current;
      if (!map || !fileData?.fileUrl || !fileData?.conversion?.has_png) return null;

      const bounds = fileData.conversion.metadata?.bounds;
      if (!Array.isArray(bounds) || bounds.length !== 4) return null;

      const [minX, minY, maxX, maxY] = bounds;
      const sourceId = `raster-source-${index}`;
      const layerId = `raster-layer-${index}`;
      const imageUrl = fileData.fileUrl.replace(/\.(tif|tiff|geotiff)$/i, ".png");

      map.addSource(sourceId, {
        type: "image",
        url: imageUrl,
        coordinates: [
          [minX, maxY],
          [maxX, maxY],
          [maxX, minY],
          [minX, minY],
        ],
      });
      registerSource(sourceId);

      map.addLayer({
        id: layerId,
        type: "raster",
        source: sourceId,
        paint: {
          "raster-opacity": 1,
        },
      });
      registerLayer(layerId);

      return [
        [minX, minY],
        [maxX, maxY],
      ] as [[number, number], [number, number]];
    },
    [registerLayer, registerSource],
  );

  const renderDataLayers = useCallback(
    (items: GeoJsonDataItem[]) => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      clearRenderedData();

      const allBounds: Array<[[number, number], [number, number]]> = [];

      items.forEach((item, index) => {
        const conversion = item.data?.conversion;

        if (conversion?.type === "vector" && conversion?.data) {
          const bounds = addGeoJsonLayer(conversion.data, index, item.name);
          if (bounds) allBounds.push(bounds);
        }

        if (conversion?.type === "raster") {
          const rasterBounds = addRasterLayer(item.data, index);
          if (rasterBounds) allBounds.push(rasterBounds);
        }
      });

      if (allBounds.length > 0) {
        map.fitBounds(mergeBounds(allBounds), {
          padding: 50,
          maxZoom: 15,
          duration: 0,
        });
      }

      requestAnimationFrame(() => map.resize());
    },
    [addGeoJsonLayer, addRasterLayer, clearRenderedData],
  );

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let removeResizeListener = () => {};

    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        const mapboxModule = await loadMapbox();
        if (cancelled || !mapContainerRef.current) return;

        const mapboxgl = mapboxModule.default;
        mapboxApiRef.current = mapboxgl;
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [104, 35],
          zoom: 4,
          attributionControl: false,
          fadeDuration: 0,
          antialias: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
        });

        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

        const resizeMap = () => {
          map.resize();
        };

        resizeObserver = new ResizeObserver(() => {
          requestAnimationFrame(resizeMap);
        });
        resizeObserver.observe(mapContainerRef.current);

        window.addEventListener("resize", resizeMap);
        removeResizeListener = () => window.removeEventListener("resize", resizeMap);

        map.once("load", () => {
          if (cancelled) return;
          setLoadState("ready");
          requestAnimationFrame(resizeMap);
        });

        map.once("error", (event) => {
          console.warn("Mapbox failed to load", event?.error || event);
          if (!cancelled) setLoadState("error");
        });
      } catch (error) {
        console.warn("Failed to initialize Mapbox", error);
        if (!cancelled) setLoadState("error");
      }
    };

    void initMap();

    return () => {
      cancelled = true;
      removeResizeListener();
      resizeObserver?.disconnect();
      clearRenderedData();
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxApiRef.current = null;
    };
  }, [clearRenderedData]);

  useEffect(() => {
    if (loadState !== "ready") return;
    renderDataLayers(geoJsonDataArray);
  }, [geoJsonDataArray, loadState, renderDataLayers]);

  return (
    <div className="relative h-full w-full min-h-[240px] overflow-hidden bg-sky-50">
      <div ref={mapContainerRef} className="h-full w-full" />
      {loadState !== "ready" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-sky-50 text-sm text-slate-500">
          {loadState === "error" ? "地图加载失败，请检查 Mapbox Token 或网络连接" : "地图加载中..."}
        </div>
      )}
    </div>
  );
}

function getBounds(geojson: any): [[number, number], [number, number]] | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const processCoords = (coords: any): void => {
    if (!Array.isArray(coords) || coords.length === 0) return;

    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      minLng = Math.min(minLng, coords[0]);
      maxLng = Math.max(maxLng, coords[0]);
      minLat = Math.min(minLat, coords[1]);
      maxLat = Math.max(maxLat, coords[1]);
      return;
    }

    coords.forEach(processCoords);
  };

  geojson.features?.forEach((feature: any) => {
    processCoords(feature?.geometry?.coordinates);
  });

  return minLng !== Infinity ? [[minLng, minLat], [maxLng, maxLat]] : null;
}

function mergeBounds(
  boundsList: Array<[[number, number], [number, number]]>,
): LngLatBoundsLike {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  boundsList.forEach(([sw, ne]) => {
    minLng = Math.min(minLng, sw[0]);
    minLat = Math.min(minLat, sw[1]);
    maxLng = Math.max(maxLng, ne[0]);
    maxLat = Math.max(maxLat, ne[1]);
  });

  return [[minLng, minLat], [maxLng, maxLat]];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
