"use client";

import { useState } from "react";
import type { FlightBoardItem } from "@/lib/flight-board";
import {
  formatAirlineCode,
  formatFlightCode,
  formatFlightTime,
  formatLiveUpdate,
  formatStatus,
} from "@/lib/flight-board/formatters";
import { cn } from "@/lib/utils";

type FlightDropdownProps = {
  flight: FlightBoardItem;
};

type MoreFlightsProps = {
  flights: FlightBoardItem[];
  direction: "arrival" | "departure";
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "size-4 transition-transform duration-200",
        open && "rotate-180"
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{open ? "Collapse" : "Expand"}</title>
      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FlightDropdown({ flight }: FlightDropdownProps) {
  const [open, setOpen] = useState(false);

  const details = [
    { label: "Flight", value: formatFlightCode(flight.flight) },
    { label: "Airline", value: formatAirlineCode(flight) },
    { label: "Scheduled", value: formatFlightTime(flight.timings.scheduled) },
    { label: "Estimated", value: formatFlightTime(flight.timings.estimated) },
    { label: "Actual", value: formatFlightTime(flight.timings.actual) },
    flight.terminal ? { label: "Terminal", value: flight.terminal } : undefined,
    flight.gate ? { label: "Gate", value: flight.gate } : undefined,
    flight.baggage ? { label: "Baggage", value: flight.baggage } : undefined,
    flight.aircraft?.icaoCode
      ? { label: "Aircraft", value: flight.aircraft.icaoCode }
      : undefined,
    flight.aircraft?.registration
      ? { label: "Reg.", value: flight.aircraft.registration }
      : undefined,
    {
      label: "Tracking",
      value: formatLiveUpdate(flight.timings.updatedTimestamp),
    },
  ].filter((d): d is { label: string; value: string } => d !== undefined);

  return (
    <div>
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 text-left text-muted-foreground/60 text-xs transition-colors hover:text-muted-foreground"
        onClick={() => {
          setOpen((v) => !v);
        }}
        type="button"
      >
        <span>{open ? "Hide details" : "Show details"}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {details.map((d) => (
            <div key={d.label}>
              <dt className="text-muted-foreground/50 text-xs uppercase tracking-wider">
                {d.label}
              </dt>
              <dd className="mt-0.5 font-mono text-sm">{d.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export function MoreFlights({ flights, direction }: MoreFlightsProps) {
  const [open, setOpen] = useState(false);

  if (flights.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-white/10 border-t pt-4">
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 text-left text-muted-foreground/50 text-xs transition-colors hover:text-muted-foreground"
        onClick={() => {
          setOpen((v) => !v);
        }}
        type="button"
      >
        <ChevronIcon open={open} />
        <span>
          {open ? "Hide" : `${flights.length} more`}{" "}
          {direction === "arrival" ? "arrivals" : "departures"}
        </span>
      </button>

      {open ? (
        <ul className="mt-3 space-y-3">
          {flights.map((flight) => {
            const time = formatFlightTime(flight.timings.estimated);
            const displayTime =
              time !== "TBD"
                ? time
                : formatFlightTime(flight.timings.scheduled);
            const airport =
              flight.route.airport.iataCode ??
              flight.route.airport.icaoCode ??
              "—";

            return (
              <li
                className="flex items-center justify-between border-white/5 border-b pb-3 last:border-0 last:pb-0"
                key={flight.id}
              >
                <div>
                  <p className="font-medium text-sm">{airport}</p>
                  <p className="text-muted-foreground/60 text-xs">
                    {formatFlightCode(flight.flight)} ·{" "}
                    {formatStatus(flight.status)}
                  </p>
                </div>
                <p className="font-mono font-semibold text-sm">{displayTime}</p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
