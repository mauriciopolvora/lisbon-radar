export type FlightBoardProvider = "airlabs";

export type FlightDirection = "arrival" | "departure";

export type FlightStatus =
  | "scheduled"
  | "live"
  | "landed"
  | "cancelled"
  | "unknown";

export type CapabilityLevel = "none" | "limited" | "full";

export type AirportReference = {
  iataCode?: string;
  icaoCode?: string;
};

export type AirlineReference = {
  iataCode?: string;
  icaoCode?: string;
};

export type FlightReference = {
  number?: string;
  iataCode?: string;
  icaoCode?: string;
  codeshareIataCode?: string;
  codeshareNumber?: string;
};

export type AircraftDetails = {
  registration?: string;
  icaoCode?: string;
  hexCode?: string;
};

export type FlightTiming = {
  local?: string;
  utc?: string;
  timestamp?: number;
};

export type FlightTimings = {
  scheduled: FlightTiming;
  estimated: FlightTiming;
  actual: FlightTiming;
  updatedTimestamp?: number;
};

export type FlightBoardItem = {
  id: string;
  direction: FlightDirection;
  status: FlightStatus;
  airline: AirlineReference;
  flight: FlightReference;
  route: {
    label: string;
    airport: AirportReference;
  };
  terminal?: string;
  gate?: string;
  baggage?: string;
  aircraft?: AircraftDetails;
  timings: FlightTimings;
  hasLiveData: boolean;
};

export type FlightBoardData = {
  airport: AirportReference & {
    name: string;
  };
  provider: FlightBoardProvider;
  arrivals: FlightBoardItem[];
  departures: FlightBoardItem[];
  generatedAt: string;
  revalidateSeconds: number;
  capabilities: {
    aircraftDetails: CapabilityLevel;
    runwayDetails: CapabilityLevel;
    liveTracking: CapabilityLevel;
  };
  notes: string[];
};

export type FlightBoardResult =
  | {
      state: "ready";
      board: FlightBoardData;
    }
  | {
      state: "configuration_required";
      provider: FlightBoardProvider;
      message: string;
      setup: string[];
    }
  | {
      state: "unavailable";
      provider: FlightBoardProvider;
      message: string;
      details?: string;
    };
