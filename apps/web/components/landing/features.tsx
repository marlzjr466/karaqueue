import {
  Search,
  PlayCircle,
  ListMusic,
  Smartphone,
  Crown,
  SlidersHorizontal
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal, RevealGroup, RevealItem } from "./reveal";

const features = [
  {
    icon: Search,
    title: "YouTube karaoke search",
    description: "Search millions of karaoke videos without leaving the app."
  },
  {
    icon: PlayCircle,
    title: "Automatic queue playback",
    description: "One song ends, the next one starts. No touching a thing."
  },
  {
    icon: ListMusic,
    title: "Playlists",
    description: "Build a set list ahead of time and load it into your queue."
  },
  {
    icon: SlidersHorizontal,
    title: "Queue management",
    description: "Reorder, skip, and clear your queue with a tap or a drag."
  },
  {
    icon: Smartphone,
    title: "Mobile experience",
    description: "A native-feeling Android app for karaoke on the go."
  },
  {
    icon: Crown,
    title: "Free & Premium plans",
    description: "Start free, upgrade for a bigger queue and unlimited playlists."
  }
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-neon-blue">Features</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Everything a karaoke night needs
          </h2>
        </Reveal>

        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <RevealItem key={feature.title}>
              <Card className="h-full">
                <CardContent>
                  <feature.icon className="h-6 w-6 text-neon-blue" />
                  <p className="mt-3 font-semibold text-white">{feature.title}</p>
                  <p className="mt-1 text-sm text-white/50">{feature.description}</p>
                </CardContent>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
