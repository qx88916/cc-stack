export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ServiceArea {
  name: string;
  bounds: {
    northEast: Coordinates;
    southWest: Coordinates;
  };
  polygon?: Coordinates[];
}
