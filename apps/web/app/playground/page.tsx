import { Button } from "../../src/components/ui/Button";

export default function PlaygroundPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl p-16">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Design System
          </p>

          <h1 className="mt-3 text-5xl font-bold tracking-tight">
            Component Playground
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            This page is only for testing reusable UI components before
            using them throughout the application.
          </p>
        </div>

        <div className="space-y-12">

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <h2 className="mb-6 text-xl font-semibold">
              Button Variants
            </h2>

            <div className="flex flex-wrap gap-4">
              <Button>
                Primary
              </Button>

              <Button variant="secondary">
                Secondary
              </Button>

              <Button variant="ghost">
                Ghost
              </Button>

              <Button variant="danger">
                Danger
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <h2 className="mb-6 text-xl font-semibold">
              Button Sizes
            </h2>

            <div className="flex items-center gap-4">
              <Button size="sm">
                Small
              </Button>

              <Button size="md">
                Medium
              </Button>

              <Button size="lg">
                Large
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <h2 className="mb-6 text-xl font-semibold">
              States
            </h2>

            <div className="max-w-sm space-y-4">
              <Button fullWidth>
                Full Width
              </Button>

              <Button
                fullWidth
                isLoading
              >
                Saving...
              </Button>

              <Button
                fullWidth
                disabled
              >
                Disabled
              </Button>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}