import { FlightSection } from "@/components/flight-board/flight-section";
import { ModeToggle } from "@/components/mode-toggle";
import { getLisbonFlightBoard } from "@/lib/flight-board";

export default async function Home() {
  const result = await getLisbonFlightBoard();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh max-w-2xl flex-col px-5 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-semibold text-xl tracking-tight">*Lisboa*</p>
            <p className="text-muted-foreground/60 text-xs">
              Humberto Delgado Airport
            </p>
          </div>
          <ModeToggle />
        </header>

        {result.state === "configuration_required" ? (
          <div className="flex flex-1 flex-col justify-center space-y-3 rounded-3xl bg-white/5 p-6">
            <p className="font-semibold text-lg">Connect a Flight API</p>
            <p className="text-muted-foreground/70 text-sm">{result.message}</p>
            <ol className="mt-2 space-y-2 text-sm">
              {result.setup.map((step) => (
                <li className="text-muted-foreground/60" key={step}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {result.state === "unavailable" ? (
          <div className="flex flex-1 flex-col justify-center rounded-3xl bg-white/5 p-6">
            <p className="font-semibold text-lg">Flight Data Unavailable</p>
            <p className="mt-2 text-muted-foreground/70 text-sm">
              {result.message}
            </p>
            {result.details ? (
              <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 font-mono text-muted-foreground/60 text-xs">
                {result.details}
              </p>
            ) : null}
          </div>
        ) : null}

        {result.state === "ready" ? (
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <FlightSection
              direction="arrival"
              emptyMessage="No arrivals in the current window."
              flights={result.board.arrivals}
              label="Arriving"
            />
            <FlightSection
              direction="departure"
              emptyMessage="No departures in the current window."
              flights={result.board.departures}
              label="Departing"
            />
          </div>
        ) : null}

        <footer className="mt-8 text-center text-muted-foreground/30 text-xs">
          {result.state === "ready"
            ? `Updated ${new Date(result.board.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Lisbon Radar"}
        </footer>
      </div>
    </main>
  );
}
