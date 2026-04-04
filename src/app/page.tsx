import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-5 p-2">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-bold text-3xl sm:text-4xl">Lisbon Radar</h1>
      </div>
    </div>
  );
}
