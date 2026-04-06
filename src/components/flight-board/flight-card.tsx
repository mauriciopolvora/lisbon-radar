import type { FlightBoardItem } from "@/lib/flight-board";
import {
  formatAirlineCode,
  formatFlightCode,
  formatFlightTime,
  formatStatus,
} from "@/lib/flight-board/formatters";
import { FlightDropdown } from "./flight-dropdown";

type FlightCardProps = {
  flight: FlightBoardItem;
};

const STATUS_DOT: Record<string, string> = {
  live: "bg-white",
  scheduled: "bg-white/30",
  landed: "bg-white/50",
  cancelled: "bg-white/20",
  unknown: "bg-white/15",
};

export function FlightCard({ flight }: FlightCardProps) {
  const estimatedTime = formatFlightTime(flight.timings.estimated);
  const displayTime =
    estimatedTime !== "TBD"
      ? estimatedTime
      : formatFlightTime(flight.timings.scheduled);

  const airport =
    flight.route.airport.iataCode ?? flight.route.airport.icaoCode ?? "Unknown";

  const dotColor = STATUS_DOT[flight.status] ?? "bg-white/20";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${dotColor}`} />
            <span className="text-muted-foreground/60 text-xs uppercase tracking-widest">
              {formatStatus(flight.status)}
            </span>
          </div>
          <p className="font-semibold text-5xl tracking-tight">{airport}</p>
          <p className="text-muted-foreground/70 text-sm">
            {flight.route.label}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold text-4xl tracking-tight">
            {displayTime}
          </p>
          <p className="mt-1 text-muted-foreground/60 text-xs">
            {formatFlightCode(flight.flight)} · {formatAirlineCode(flight)}
          </p>
        </div>
      </div>

      <FlightDropdown flight={flight} />
    </div>
  );
}
