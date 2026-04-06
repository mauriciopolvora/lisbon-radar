import "server-only";

import { getAirLabsFlightBoard } from "./airlabs";
import { getFlightBoardConfig } from "./config";
import type { FlightBoardResult } from "./types";

export async function getLisbonFlightBoard(): Promise<FlightBoardResult> {
  const config = getFlightBoardConfig();
  const airlabsApiKey = config.airlabsApiKey;

  if (!airlabsApiKey) {
    return {
      message:
        "Add an AirLabs API key to load live Lisbon arrivals and departures.",
      provider: config.provider,
      setup: [
        "Create an AirLabs API key.",
        "Set AIRLABS_API_KEY in your local environment.",
        "Optional: tune FLIGHT_BOARD_REVALIDATE_SECONDS for fresher or cheaper refreshes.",
      ],
      state: "configuration_required",
    };
  }

  switch (config.provider) {
    case "airlabs":
      return await getAirLabsFlightBoard({
        ...config,
        airlabsApiKey,
      });
    default:
      return {
        message: "The selected flight-data provider is not supported yet.",
        provider: config.provider,
        state: "unavailable",
      };
  }
}

export type {
  FlightBoardData,
  FlightBoardItem,
  FlightBoardResult,
  FlightDirection,
  FlightStatus,
} from "./types";
