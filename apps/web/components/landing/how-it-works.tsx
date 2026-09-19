import { Search, ListPlus, Mic2, Repeat } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "./reveal";

const steps = [
  {
    icon: Search,
    title: "Search",
    description: "Find your favorite karaoke videos on YouTube."
  },
  {
    icon: ListPlus,
    title: "Queue",
    description: "Add songs to your karaoke queue in seconds."
  },
  {
    icon: Mic2,
    title: "Sing",
    description: "Press play and let the queue run itself."
  },
  {
    icon: Repeat,
    title: "Repeat",
    description: "Keep singing until the queue is empty."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-neon-blue">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            From search to sold-out set
          </h2>
        </Reveal>

        <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <RevealItem
              key={step.title}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <span className="absolute right-4 top-4 text-4xl font-bold text-white/5">
                {i + 1}
              </span>
              <step.icon className="h-8 w-8 text-neon-magenta" />
              <p className="mt-4 font-semibold text-white">{step.title}</p>
              <p className="mt-1 text-sm text-white/50">{step.description}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
