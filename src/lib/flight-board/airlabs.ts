import { LISBON_AIRPORT } from "./config";
import type {
  FlightBoardItem,
  FlightBoardResult,
  FlightDirection,
  FlightStatus,
  FlightTiming,
} from "./types";

const AIRLABS_BASE_URL = "https://airlabs.co/api/v9";
const ARRIVALS_LOOKBACK_MINUTES = 90;
const DEPARTURES_LOOKBACK_MINUTES = 60;
const UPCOMING_WINDOW_MINUTES = 360;
const CURRENT_ARRIVAL_LIVE_WINDOW_MINUTES = 120;
const CURRENT_ARRIVAL_LANDED_WINDOW_MINUTES = 45;
const CURRENT_ARRIVAL_UPCOMING_WINDOW_MINUTES = 120;
const CURRENT_DEPARTURE_LIVE_WINDOW_MINUTES = 90;
const CURRENT_DEPARTURE_RECENT_WINDOW_MINUTES = 45;
const CURRENT_DEPARTURE_UPCOMING_WINDOW_MINUTES = 120;
const FLIGHT_BOARD_CACHE_TAGS = ["flight-board", "flight-board:airlabs"];
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const CURRENT_BUCKET_LIVE = 0;
const CURRENT_BUCKET_RECENT = 1;
const CURRENT_BUCKET_UPCOMING = 2;
const STATUS_PRIORITY_CANCELLED = 3;
const STATUS_PRIORITY_UNKNOWN = 4;
const UNKNOWN_AIRPORT_LABEL = "Unknown";
const UNKNOWN_FLIGHT_LABEL = "unknown";

type CurrentFlightScore = {
  bucket: number;
  deltaMs: number;
};

type AirLabsScheduleEntry = {
  airline_iata?: string | null;
  airline_icao?: string | null;
  flight_iata?: string | null;
  flight_icao?: string | null;
  flight_number?: string | null;
  cs_airline_iata?: string | null;
  cs_flight_iata?: string | null;
  cs_flight_number?: string | null;
  dep_iata?: string | null;
  dep_icao?: string | null;
  dep_terminal?: string | null;
  dep_gate?: string | null;
  dep_time?: string | null;
  dep_time_ts?: number | null;
  dep_time_utc?: string | null;
  dep_estimated?: string | null;
  dep_estimated_ts?: number | null;
  dep_estimated_utc?: string | null;
  dep_actual?: string | null;
  dep_actual_ts?: number | null;
  dep_actual_utc?: string | null;
  arr_iata?: string | null;
  arr_icao?: string | null;
  arr_terminal?: string | null;
  arr_gate?: string | null;
  arr_baggage?: string | null;
  arr_time?: string | null;
  arr_time_ts?: number | null;
  arr_time_utc?: string | null;
  arr_estimated?: string | null;
  arr_estimated_ts?: number | null;
  arr_estimated_utc?: string | null;
  arr_actual?: string | null;
  arr_actual_ts?: number | null;
  arr_actual_utc?: string | null;
  status?: string | null;
};

type AirLabsLiveFlight = {
  hex?: string | null;
  reg_number?: string | null;
  aircraft_icao?: string | null;
  airline_iata?: string | null;
  airline_icao?: string | null;
  flight_iata?: string | null;
  flight_icao?: string | null;
  flight_number?: string | null;
  dep_iata?: string | null;
  dep_icao?: string | null;
  arr_iata?: string | null;
  arr_icao?: string | null;
  updated?: number | null;
  status?: string | null;
};

type AirLabsPayload<T> =
  | T[]
  | {
      data?: T[];
      error?:
        | {
            code?: number;
            message?: string;
          }
        | string;
      message?: string;
      response?: T[];
    };

type AirLabsConfig = {
  airlabsApiKey: string;
  maxFlights: number;
  revalidateSeconds: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toOptionalString(value: string | null | undefined) {
  if (!value) {
    return;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return;
  }

  return normalizedValue;
}

function toOptionalNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return;
  }

  return value;
}

function getErrorMessage(payload: Record<string, unknown>, endpoint: string) {
  const error = payload.error;

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  if (typeof payload.message === "string" && payload.message.length > 0) {
    return payload.message;
  }

  return `AirLabs ${endpoint} request failed.`;
}

function unwrapArrayPayload<T>(payload: unknown, endpoint: string) {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (isRecord(payload)) {
    if ("error" in payload || "message" in payload) {
      const errorMessage = getErrorMessage(payload, endpoint);

      if ("error" in payload && payload.error) {
        throw new Error(errorMessage);
      }
    }

    if (Array.isArray(payload.response)) {
      return payload.response as T[];
    }

    if (Array.isArray(payload.data)) {
      return payload.data as T[];
    }
  }

  throw new Error(`AirLabs ${endpoint} response shape is not supported.`);
}

async function fetchAirLabsArray<T>(
  endpoint: string,
  params: Record<string, string>,
  config: AirLabsConfig
) {
  const searchParams = new URLSearchParams({
    ...params,
    api_key: config.airlabsApiKey,
  });

  const response = await fetch(
    `${AIRLABS_BASE_URL}/${endpoint}?${searchParams}`,
    {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: config.revalidateSeconds,
        tags: FLIGHT_BOARD_CACHE_TAGS,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `AirLabs ${endpoint} request failed with status ${response.status}.`
    );
  }

  const payload = (await response.json()) as AirLabsPayload<T>;

  return unwrapArrayPayload<T>(payload, endpoint);
}

function buildLiveFlightMap(liveFlights: AirLabsLiveFlight[]) {
  const flightMap = new Map<string, AirLabsLiveFlight>();

  for (const liveFlight of liveFlights) {
    for (const key of getFlightKeys(liveFlight)) {
      if (!flightMap.has(key)) {
        flightMap.set(key, liveFlight);
      }
    }
  }

  return flightMap;
}

function getFlightKeys(
  flight: Pick<
    AirLabsScheduleEntry | AirLabsLiveFlight,
    | "arr_iata"
    | "arr_icao"
    | "dep_iata"
    | "dep_icao"
    | "flight_iata"
    | "flight_icao"
    | "flight_number"
  >
) {
  const keys = new Set<string>();
  const flightIata = toOptionalString(flight.flight_iata);
  const flightIcao = toOptionalString(flight.flight_icao);
  const flightNumber = toOptionalString(flight.flight_number);
  const departureCode =
    toOptionalString(flight.dep_iata) ?? toOptionalString(flight.dep_icao);
  const arrivalCode =
    toOptionalString(flight.arr_iata) ?? toOptionalString(flight.arr_icao);

  if (flightIata) {
    keys.add(`iata:${flightIata}`);
  }

  if (flightIcao) {
    keys.add(`icao:${flightIcao}`);
  }

  if (flightNumber && departureCode && arrivalCode) {
    keys.add(`route:${flightNumber}:${departureCode}:${arrivalCode}`);
  }

  return keys;
}

function matchLiveFlight(
  scheduleEntry: AirLabsScheduleEntry,
  liveFlightMap: Map<string, AirLabsLiveFlight>
) {
  for (const key of getFlightKeys(scheduleEntry)) {
    const liveFlight = liveFlightMap.get(key);

    if (liveFlight) {
      return liveFlight;
    }
  }

  return;
}

function normalizeStatus(status: string | undefined) {
  if (!status) {
    return "unknown";
  }

  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus === "en-route" ||
    normalizedStatus === "boarding" ||
    normalizedStatus === "active"
  ) {
    return "live";
  }

  if (normalizedStatus === "scheduled") {
    return "scheduled";
  }

  if (normalizedStatus === "landed") {
    return "landed";
  }

  if (normalizedStatus === "cancelled") {
    return "cancelled";
  }

  return "unknown";
}

function getStatusPriority(status: FlightStatus) {
  switch (status) {
    case "live":
      return 0;
    case "scheduled":
      return 1;
    case "landed":
      return 2;
    case "cancelled":
      return STATUS_PRIORITY_CANCELLED;
    default:
      return STATUS_PRIORITY_UNKNOWN;
  }
}

function getPrimaryTimestamp(flight: FlightBoardItem) {
  return (
    flight.timings.actual.timestamp ??
    flight.timings.estimated.timestamp ??
    flight.timings.scheduled.timestamp ??
    Number.POSITIVE_INFINITY
  );
}

function getEstimatedOrScheduledTimestamp(flight: FlightBoardItem) {
  return (
    flight.timings.estimated.timestamp ?? flight.timings.scheduled.timestamp
  );
}

function getDepartureLiveTimestamp(flight: FlightBoardItem) {
  return (
    flight.timings.actual.timestamp ??
    flight.timings.estimated.timestamp ??
    flight.timings.scheduled.timestamp
  );
}

function isWithinWindow(
  timestamp: number | undefined,
  nowTimestamp: number,
  startMinutes: number,
  endMinutes: number
) {
  if (timestamp === undefined) {
    return false;
  }

  const startMs = startMinutes * MILLISECONDS_PER_MINUTE;
  const endMs = endMinutes * MILLISECONDS_PER_MINUTE;

  return (
    timestamp >= nowTimestamp - startMs && timestamp <= nowTimestamp + endMs
  );
}

function getArrivalCurrentScore(
  flight: FlightBoardItem,
  nowTimestamp: number
): CurrentFlightScore | undefined {
  const liveTimestamp = getEstimatedOrScheduledTimestamp(flight);

  if (
    flight.status === "live" &&
    isWithinWindow(
      liveTimestamp,
      nowTimestamp,
      CURRENT_ARRIVAL_LIVE_WINDOW_MINUTES,
      CURRENT_ARRIVAL_LIVE_WINDOW_MINUTES
    )
  ) {
    return {
      bucket: CURRENT_BUCKET_LIVE,
      deltaMs: Math.abs((liveTimestamp ?? nowTimestamp) - nowTimestamp),
    };
  }

  const landedTimestamp =
    flight.timings.actual.timestamp ?? getEstimatedOrScheduledTimestamp(flight);

  if (
    flight.status === "landed" &&
    isWithinWindow(
      landedTimestamp,
      nowTimestamp,
      CURRENT_ARRIVAL_LANDED_WINDOW_MINUTES,
      0
    )
  ) {
    return {
      bucket: CURRENT_BUCKET_RECENT,
      deltaMs: nowTimestamp - (landedTimestamp ?? nowTimestamp),
    };
  }

  const upcomingTimestamp = getEstimatedOrScheduledTimestamp(flight);

  if (
    isWithinWindow(
      upcomingTimestamp,
      nowTimestamp,
      0,
      CURRENT_ARRIVAL_UPCOMING_WINDOW_MINUTES
    )
  ) {
    return {
      bucket: CURRENT_BUCKET_UPCOMING,
      deltaMs: (upcomingTimestamp ?? nowTimestamp) - nowTimestamp,
    };
  }

  return;
}

function getDepartureCurrentScore(
  flight: FlightBoardItem,
  nowTimestamp: number
): CurrentFlightScore | undefined {
  const liveTimestamp = getDepartureLiveTimestamp(flight);

  if (
    flight.status === "live" &&
    isWithinWindow(
      liveTimestamp,
      nowTimestamp,
      CURRENT_DEPARTURE_LIVE_WINDOW_MINUTES,
      CURRENT_DEPARTURE_LIVE_WINDOW_MINUTES
    )
  ) {
    return {
      bucket: CURRENT_BUCKET_LIVE,
      deltaMs: Math.abs((liveTimestamp ?? nowTimestamp) - nowTimestamp),
    };
  }

  const upcomingTimestamp = getEstimatedOrScheduledTimestamp(flight);

  if (
    isWithinWindow(
      upcomingTimestamp,
      nowTimestamp,
      0,
      CURRENT_DEPARTURE_UPCOMING_WINDOW_MINUTES
    )
  ) {
    return {
      bucket: CURRENT_BUCKET_UPCOMING,
      deltaMs: (upcomingTimestamp ?? nowTimestamp) - nowTimestamp,
    };
  }

  const recentDepartureTimestamp = flight.timings.actual.timestamp;

  if (
    isWithinWindow(
      recentDepartureTimestamp,
      nowTimestamp,
      CURRENT_DEPARTURE_RECENT_WINDOW_MINUTES,
      0
    )
  ) {
    return {
      bucket: CURRENT_BUCKET_RECENT,
      deltaMs: nowTimestamp - (recentDepartureTimestamp ?? nowTimestamp),
    };
  }

  return;
}

function getCurrentFlightScore(
  flight: FlightBoardItem,
  nowTimestamp: number
): CurrentFlightScore | undefined {
  if (flight.direction === "arrival") {
    return getArrivalCurrentScore(flight, nowTimestamp);
  }

  return getDepartureCurrentScore(flight, nowTimestamp);
}

function getCurrentFeaturedFlight(
  flights: FlightBoardItem[],
  nowTimestamp: number
) {
  const scoredFlights = flights
    .flatMap((flight) => {
      const score = getCurrentFlightScore(flight, nowTimestamp);

      if (!score) {
        return [];
      }

      return [{ flight, score }];
    })
    .sort((firstFlight, secondFlight) => {
      const bucketDifference =
        firstFlight.score.bucket - secondFlight.score.bucket;

      if (bucketDifference !== 0) {
        return bucketDifference;
      }

      if (firstFlight.score.deltaMs !== secondFlight.score.deltaMs) {
        return firstFlight.score.deltaMs - secondFlight.score.deltaMs;
      }

      return (
        getPrimaryTimestamp(firstFlight.flight) -
        getPrimaryTimestamp(secondFlight.flight)
      );
    });

  return scoredFlights[0]?.flight;
}

function isRelevantFlight(flight: FlightBoardItem, nowTimestamp: number) {
  const primaryTimestamp = getPrimaryTimestamp(flight);
  const lookbackMinutes =
    flight.direction === "arrival"
      ? ARRIVALS_LOOKBACK_MINUTES
      : DEPARTURES_LOOKBACK_MINUTES;
  const lookbackWindow = lookbackMinutes * MILLISECONDS_PER_MINUTE;
  const upcomingWindow = UPCOMING_WINDOW_MINUTES * MILLISECONDS_PER_MINUTE;

  return (
    primaryTimestamp >= nowTimestamp - lookbackWindow &&
    primaryTimestamp <= nowTimestamp + upcomingWindow
  );
}

function sortFlights(flights: FlightBoardItem[]) {
  return [...flights].sort((firstFlight, secondFlight) => {
    const statusDifference =
      getStatusPriority(firstFlight.status) -
      getStatusPriority(secondFlight.status);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return getPrimaryTimestamp(firstFlight) - getPrimaryTimestamp(secondFlight);
  });
}

function selectVisibleFlights(
  flights: FlightBoardItem[],
  nowTimestamp: number,
  maxFlights: number
) {
  const sortedFlights = sortFlights(flights);
  const relevantFlights = sortedFlights.filter((flight) =>
    isRelevantFlight(flight, nowTimestamp)
  );
  const displayFlights =
    relevantFlights.length > 0 ? relevantFlights : sortedFlights;
  const featuredFlight = getCurrentFeaturedFlight(displayFlights, nowTimestamp);

  if (featuredFlight) {
    const remainingFlights = displayFlights.filter(
      (flight) => flight.id !== featuredFlight.id
    );

    return [featuredFlight, ...remainingFlights.slice(0, maxFlights - 1)];
  }

  return displayFlights.slice(0, maxFlights);
}

function getDirectionalValue<T>(
  direction: FlightDirection,
  arrivalValue: T,
  departureValue: T
) {
  return direction === "arrival" ? arrivalValue : departureValue;
}

function normalizeUnixSecondsToMilliseconds(timestamp: number | undefined) {
  if (timestamp === undefined) {
    return;
  }

  return timestamp * MILLISECONDS_PER_SECOND;
}

function buildTiming(
  local: string | undefined,
  utc: string | undefined,
  timestamp: number | undefined
): FlightTiming {
  return {
    local,
    timestamp: normalizeUnixSecondsToMilliseconds(timestamp),
    utc,
  };
}

function buildRouteCode(
  entry: AirLabsScheduleEntry,
  direction: FlightDirection
) {
  return getDirectionalValue(
    direction,
    toOptionalString(entry.dep_iata) ?? toOptionalString(entry.dep_icao),
    toOptionalString(entry.arr_iata) ?? toOptionalString(entry.arr_icao)
  );
}

function buildFlightId(
  entry: AirLabsScheduleEntry,
  direction: FlightDirection,
  routeCode: string | undefined,
  scheduledTimestamp: number | undefined
) {
  return (
    toOptionalString(entry.flight_iata) ??
    toOptionalString(entry.flight_icao) ??
    [
      direction,
      toOptionalString(entry.flight_number) ?? UNKNOWN_FLIGHT_LABEL,
      routeCode ?? UNKNOWN_FLIGHT_LABEL,
      String(scheduledTimestamp ?? Date.now()),
    ].join(":")
  );
}

function buildAircraftDetails(liveFlight?: AirLabsLiveFlight) {
  if (!liveFlight) {
    return;
  }

  const registration = toOptionalString(liveFlight.reg_number);
  const icaoCode = toOptionalString(liveFlight.aircraft_icao);
  const hexCode = toOptionalString(liveFlight.hex);

  if (!(registration || icaoCode || hexCode)) {
    return;
  }

  return {
    hexCode,
    icaoCode,
    registration,
  };
}

function buildRouteAirport(
  entry: AirLabsScheduleEntry,
  direction: FlightDirection
) {
  return {
    iataCode: getDirectionalValue(
      direction,
      toOptionalString(entry.dep_iata),
      toOptionalString(entry.arr_iata)
    ),
    icaoCode: getDirectionalValue(
      direction,
      toOptionalString(entry.dep_icao),
      toOptionalString(entry.arr_icao)
    ),
  };
}

function buildTimings(
  entry: AirLabsScheduleEntry,
  direction: FlightDirection,
  liveFlight?: AirLabsLiveFlight
) {
  return {
    actual: buildTiming(
      getDirectionalValue(
        direction,
        toOptionalString(entry.arr_actual),
        toOptionalString(entry.dep_actual)
      ),
      getDirectionalValue(
        direction,
        toOptionalString(entry.arr_actual_utc),
        toOptionalString(entry.dep_actual_utc)
      ),
      getDirectionalValue(
        direction,
        toOptionalNumber(entry.arr_actual_ts),
        toOptionalNumber(entry.dep_actual_ts)
      )
    ),
    estimated: buildTiming(
      getDirectionalValue(
        direction,
        toOptionalString(entry.arr_estimated),
        toOptionalString(entry.dep_estimated)
      ),
      getDirectionalValue(
        direction,
        toOptionalString(entry.arr_estimated_utc),
        toOptionalString(entry.dep_estimated_utc)
      ),
      getDirectionalValue(
        direction,
        toOptionalNumber(entry.arr_estimated_ts),
        toOptionalNumber(entry.dep_estimated_ts)
      )
    ),
    scheduled: buildTiming(
      getDirectionalValue(
        direction,
        toOptionalString(entry.arr_time),
        toOptionalString(entry.dep_time)
      ),
      getDirectionalValue(
        direction,
        toOptionalString(entry.arr_time_utc),
        toOptionalString(entry.dep_time_utc)
      ),
      getDirectionalValue(
        direction,
        toOptionalNumber(entry.arr_time_ts),
        toOptionalNumber(entry.dep_time_ts)
      )
    ),
    updatedTimestamp: normalizeUnixSecondsToMilliseconds(
      toOptionalNumber(liveFlight?.updated)
    ),
  };
}

function normalizeScheduleEntry(
  entry: AirLabsScheduleEntry,
  direction: FlightDirection,
  liveFlight?: AirLabsLiveFlight
) {
  const routeCode = buildRouteCode(entry, direction);
  const timings = buildTimings(entry, direction, liveFlight);
  const status = normalizeStatus(
    toOptionalString(liveFlight?.status) ?? toOptionalString(entry.status)
  );
  const flightId = buildFlightId(
    entry,
    direction,
    routeCode,
    timings.scheduled.timestamp
  );

  return {
    aircraft: buildAircraftDetails(liveFlight),
    airline: {
      iataCode:
        toOptionalString(entry.airline_iata) ??
        toOptionalString(liveFlight?.airline_iata),
      icaoCode:
        toOptionalString(entry.airline_icao) ??
        toOptionalString(liveFlight?.airline_icao),
    },
    baggage:
      direction === "arrival" ? toOptionalString(entry.arr_baggage) : undefined,
    direction,
    flight: {
      codeshareIataCode: toOptionalString(entry.cs_flight_iata),
      codeshareNumber: toOptionalString(entry.cs_flight_number),
      iataCode:
        toOptionalString(entry.flight_iata) ??
        toOptionalString(liveFlight?.flight_iata),
      icaoCode:
        toOptionalString(entry.flight_icao) ??
        toOptionalString(liveFlight?.flight_icao),
      number:
        toOptionalString(entry.flight_number) ??
        toOptionalString(liveFlight?.flight_number),
    },
    gate: getDirectionalValue(
      direction,
      toOptionalString(entry.arr_gate),
      toOptionalString(entry.dep_gate)
    ),
    hasLiveData: Boolean(liveFlight),
    id: flightId,
    route: {
      airport: buildRouteAirport(entry, direction),
      label: `${direction === "arrival" ? "From" : "To"} ${routeCode ?? UNKNOWN_AIRPORT_LABEL}`,
    },
    status,
    terminal: getDirectionalValue(
      direction,
      toOptionalString(entry.arr_terminal),
      toOptionalString(entry.dep_terminal)
    ),
    timings,
  } satisfies FlightBoardItem;
}

export async function getAirLabsFlightBoard(
  config: AirLabsConfig
): Promise<FlightBoardResult> {
  try {
    const [
      arrivalSchedule,
      departureSchedule,
      arrivalLiveFlights,
      departureLiveFlights,
    ] = await Promise.all([
      fetchAirLabsArray<AirLabsScheduleEntry>(
        "schedules",
        { arr_iata: LISBON_AIRPORT.iataCode },
        config
      ),
      fetchAirLabsArray<AirLabsScheduleEntry>(
        "schedules",
        { dep_iata: LISBON_AIRPORT.iataCode },
        config
      ),
      fetchAirLabsArray<AirLabsLiveFlight>(
        "flights",
        { arr_iata: LISBON_AIRPORT.iataCode },
        config
      ),
      fetchAirLabsArray<AirLabsLiveFlight>(
        "flights",
        { dep_iata: LISBON_AIRPORT.iataCode },
        config
      ),
    ]);

    const arrivalLiveFlightMap = buildLiveFlightMap(arrivalLiveFlights);
    const departureLiveFlightMap = buildLiveFlightMap(departureLiveFlights);
    const nowTimestamp = Date.now();
    const arrivals = arrivalSchedule.map((entry) =>
      normalizeScheduleEntry(
        entry,
        "arrival",
        matchLiveFlight(entry, arrivalLiveFlightMap)
      )
    );
    const departures = departureSchedule.map((entry) =>
      normalizeScheduleEntry(
        entry,
        "departure",
        matchLiveFlight(entry, departureLiveFlightMap)
      )
    );

    return {
      state: "ready",
      board: {
        airport: LISBON_AIRPORT,
        arrivals: selectVisibleFlights(
          arrivals,
          nowTimestamp,
          config.maxFlights
        ),
        capabilities: {
          aircraftDetails: "limited",
          liveTracking: "limited",
          runwayDetails: "none",
        },
        departures: selectVisibleFlights(
          departures,
          nowTimestamp,
          config.maxFlights
        ),
        generatedAt: new Date(nowTimestamp).toISOString(),
        notes: [
          "AirLabs free-first data works well for arrivals and departures, but aircraft details only appear when matching live tracking data is available.",
          "Runway assignments are intentionally omitted in v1 because they are not reliably available on the chosen free provider.",
          `The board is cached for ${config.revalidateSeconds} seconds to keep API usage reasonable on a public page.`,
        ],
        provider: "airlabs",
        revalidateSeconds: config.revalidateSeconds,
      },
    };
  } catch (error) {
    const details = error instanceof Error ? error.message : undefined;

    return {
      details,
      message:
        "The flight board could not reach AirLabs right now. Check the API key, rate limits, and network access.",
      provider: "airlabs",
      state: "unavailable",
    };
  }
}
