import chroma from 'chroma-js';
import _ from 'lodash';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as React from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import { Location, TopologyMetrics } from '../../../api/loki';
import { observeDOMRect } from '../../../utils/metrics-helper';

export interface NetflowMaoProps {
  loading?: boolean;
  metrics?: TopologyMetrics[];
}

export const NetflowMap: React.FC<NetflowMaoProps> = ({ loading, metrics }) => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [containerSize, setContainerSize] = React.useState<DOMRect>({ width: 500, height: 500 } as DOMRect);

  React.useEffect(() => {
    observeDOMRect(containerRef, containerSize, setContainerSize);
  }, [containerRef, containerSize]);

  const getMarkers = React.useCallback(() => {
    if (!metrics) {
      return <></>;
    }
    const locations = _.uniqBy(
      metrics.flatMap(m => [m.source.location, m.destination.location]).filter(l => l),
      'cityName'
    ) as Location[];
    const color = chroma.scale('Set2').classes(locations.length);
    return locations.map((l, i) => {
      return (
        <Marker
          key={i}
          latitude={l.latitude}
          longitude={l.longitude}
          color={color(i / locations.length).hex()}
          popup={new maplibregl.Popup().setText(`${l.addr} - ${l.regionName} ${l.countryName} ${l.cityName}`)}
        />
      );
    });
  }, [metrics]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Map
        // Red Hat HQ coordinates
        initialViewState={{
          latitude: 35.7737546,
          longitude: -78.64571,
          zoom: 1.75
        }}
        style={{ width: containerSize.width, height: containerSize.height }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        {getMarkers()}
      </Map>
    </div>
  );
};

export default NetflowMap;
