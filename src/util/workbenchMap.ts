export type GeoJsonLayer = { name: string; data: unknown };

export const fallbackMapLayers: GeoJsonLayer[] = [
  {
    name: "黄河干流示意",
    data: {
      conversion: {
        type: "vector",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Yellow River schematic" },
              geometry: {
                type: "LineString",
                coordinates: [
                  [96.2, 35.9],
                  [99.4, 36.4],
                  [101.8, 36.1],
                  [104.2, 37.3],
                  [106.8, 37.7],
                  [109.1, 36.6],
                  [111.6, 35.0],
                  [113.8, 34.9],
                  [116.0, 36.0],
                  [119.0, 37.6],
                ],
              },
            },
          ],
        },
      },
    },
  },
  {
    name: "研究区占位范围",
    data: {
      conversion: {
        type: "vector",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Default study extent" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [94.8, 32.8],
                    [120.2, 32.8],
                    [120.2, 39.6],
                    [94.8, 39.6],
                    [94.8, 32.8],
                  ],
                ],
              },
            },
          ],
        },
      },
    },
  },
];

export const collectMapLayers = async (result: unknown): Promise<GeoJsonLayer[]> => {
  const rawOutputs = getResultOutputItems(result);
  const layers: GeoJsonLayer[] = [];

  for (let index = 0; index < rawOutputs.length; index += 1) {
    const item = rawOutputs[index];
    const name = readString(item, ["name", "outputName"], `Output-${index + 1}`);
    const conversion = readRecord(item.conversion);
    const inlineGeoJson = item.geojson;
    const url = readString(item, ["url"]);

    if (conversion?.data) {
      layers.push({ name, data: { conversion: { type: "vector", data: conversion.data } } });
    } else if (inlineGeoJson) {
      layers.push({ name, data: { conversion: { type: "vector", data: inlineGeoJson } } });
    } else if (isGeoJsonUrl(url)) {
      try {
        const response = await fetch(url);
        const geojson = await response.json();
        layers.push({ name, data: { conversion: { type: "vector", data: geojson } } });
      } catch (error) {
        console.warn("Load result geojson failed", url, error);
      }
    }
  }

  return layers;
};

const getResultOutputItems = (result: unknown): Record<string, unknown>[] => {
  const record = readRecord(result);
  const items = Array.isArray(record?.result) ? record.result : Array.isArray(record?.outputs) ? record.outputs : [];
  return items.filter((item): item is Record<string, unknown> => Boolean(readRecord(item)));
};

const readRecord = (value: unknown): Record<string, unknown> | null => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
};

const readString = (record: Record<string, unknown> | null, keys: string[], fallback = "") => {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return fallback;
};

const isGeoJsonUrl = (url: string) => /\.(geojson|json)(\?|$)/i.test(url);
