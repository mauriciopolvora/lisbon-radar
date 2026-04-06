export default function Loading() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh max-w-2xl flex-col px-5 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-28 animate-pulse rounded bg-muted" />
            <div className="h-4 w-44 animate-pulse rounded bg-muted" />
          </div>
          <div className="size-12 animate-pulse rounded-2xl bg-muted" />
        </header>

        <div className="grid items-start gap-4 sm:grid-cols-2">
          {["arrivals", "departures"].map((section) => (
            <section
              className="flex flex-col rounded-3xl bg-white/5 p-6 backdrop-blur-sm"
              key={section}
            >
              <div className="mb-6 h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-14 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="ml-auto h-10 w-24 animate-pulse rounded bg-muted" />
                    <div className="ml-auto h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="border-white/10 border-t pt-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
