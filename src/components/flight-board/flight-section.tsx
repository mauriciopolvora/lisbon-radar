import type { FlightBoardItem } from "@/lib/flight-board";
import { FlightCard } from "./flight-card";
import { MoreFlights } from "./flight-dropdown";

type FlightSectionProps = {
  emptyMessage: string;
  flights: FlightBoardItem[];
  label: string;
  direction: "arrival" | "departure";
};

export function FlightSection({
  emptyMessage,
  flights,
  label,
  direction,
}: FlightSectionProps) {
  const [featuredFlight, ...rest] = flights;

  return (
    <section className="flex flex-col rounded-3xl bg-white/5 p-6 backdrop-blur-sm">
      <p className="mb-6 text-muted-foreground/50 text-xs uppercase tracking-widest">
        {label}
      </p>

      {featuredFlight ? (
        <>
          <FlightCard flight={featuredFlight} />
          <MoreFlights direction={direction} flights={rest} />
        </>
      ) : (
        <div className="flex flex-1 flex-col justify-center">
          <p className="font-medium text-lg opacity-60">No flights</p>
          <p className="mt-1 text-muted-foreground/50 text-sm">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
}
