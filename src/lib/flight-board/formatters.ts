import type {
  CapabilityLevel,
  FlightBoardItem,
  FlightStatus,
  FlightTiming,
} from "./types";

const CLOCK_SEGMENT_COUNT = 2;
const CLOCK_SEGMENT_INDEX = 1;
const CLOCK_LENGTH = 5;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

function getClockFromSource(value: string | undefined) {
  if (!value) {
    return "TBD";
  }

  const segments = value.split(" ");

  if (segments.length < CLOCK_SEGMENT_COUNT) {
    return value;
  }

  return segments[CLOCK_SEGMENT_INDEX]?.slice(0, CLOCK_LENGTH) ?? value;
}

export function formatFlightTime(timing: FlightTiming) {
  return getClockFromSource(timing.local);
}

export function formatFlightCode(flight: FlightBoardItem["flight"]) {
  return (
    flight.iataCode ?? flight.icaoCode ?? flight.number ?? "Unknown flight"
  );
}

export function formatAirlineCode(flight: FlightBoardItem) {
  return (
    flight.airline.iataCode ?? flight.airline.icaoCode ?? "Unknown airline"
  );
}

export function formatStatus(status: FlightStatus) {
  switch (status) {
    case "live":
      return "Live";
    case "scheduled":
      return "Scheduled";
    case "landed":
      return "Landed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

export function formatLiveUpdate(timestamp: number | undefined) {
  if (!timestamp) {
    return "Live data unavailable";
  }

  const currentTimestamp = Date.now();
  const differenceInMinutes = Math.max(
    0,
    Math.round(
      (currentTimestamp - timestamp) /
        MILLISECONDS_PER_SECOND /
        SECONDS_PER_MINUTE
    )
  );

  if (differenceInMinutes === 0) {
    return "Live signal just now";
  }

  if (differenceInMinutes === 1) {
    return "Live signal 1 minute ago";
  }

  return `Live signal ${differenceInMinutes} minutes ago`;
}

export function formatCapability(capability: CapabilityLevel) {
  switch (capability) {
    case "full":
      return "Full";
    case "limited":
      return "Limited";
    default:
      return "Unavailable";
  }
}
