import type { FlightBoardProvider } from "./types";

const DEFAULT_REVALIDATE_SECONDS = 300;
const DEFAULT_MAX_FLIGHTS = 6;

const SUPPORTED_PROVIDERS: FlightBoardProvider[] = ["airlabs"];

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function normalizeProvider(value: string | undefined): FlightBoardProvider {
  if (!value) {
    return "airlabs";
  }

  const normalizedValue = value.toLowerCase();

  for (const provider of SUPPORTED_PROVIDERS) {
    if (provider === normalizedValue) {
      return provider;
    }
  }

  return "airlabs";
}

export const LISBON_AIRPORT = {
  iataCode: "LIS",
  icaoCode: "LPPT",
  name: "Humberto Delgado Airport",
};

export function getFlightBoardConfig() {
  return {
    provider: normalizeProvider(process.env.FLIGHT_DATA_PROVIDER),
    airlabsApiKey: process.env.AIRLABS_API_KEY,
    revalidateSeconds: parsePositiveInteger(
      process.env.FLIGHT_BOARD_REVALIDATE_SECONDS,
      DEFAULT_REVALIDATE_SECONDS
    ),
    maxFlights: parsePositiveInteger(
      process.env.FLIGHT_BOARD_MAX_FLIGHTS,
      DEFAULT_MAX_FLIGHTS
    ),
  };
}
