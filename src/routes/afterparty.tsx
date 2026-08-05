import { createFileRoute } from "@tanstack/react-router";
import { ENTRY_AFTERPARTY, rememberEntryIfUnset } from "../lib/entry-cookie";
import { WeddingQuest } from "../wedding/WeddingQuest";

export const Route = createFileRoute("/afterparty")({
  beforeLoad: () => {
    rememberEntryIfUnset(ENTRY_AFTERPARTY);
  },
  head: () => ({
    meta: [
      { title: "Afterka · Natália & Oto · 10.10.2026" },
      {
        name: "description",
        content:
          "Pozvánka na afterku Natálie a Ota. Obrad 15:30, afterka od 21:00 — Brno, 10.10.2026.",
      },
      { property: "og:title", content: "Afterka · Natália & Oto · 10.10.2026" },
      {
        property: "og:description",
        content: "Hostinu nechávame v užšom kruhu — večer otvárame. Brno, 10.10.2026.",
      },
    ],
  }),
  component: () => <WeddingQuest variant="afterparty" />,
});
