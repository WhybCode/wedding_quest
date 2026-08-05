import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  ENTRY_FULL,
  rememberEntryIfUnset,
  shouldRedirectHomeToAfterparty,
} from "../lib/entry-cookie";
import { WeddingQuest } from "../wedding/WeddingQuest";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (shouldRedirectHomeToAfterparty()) {
      throw redirect({ to: "/afterparty" });
    }
    rememberEntryIfUnset(ENTRY_FULL);
  },
  component: () => <WeddingQuest variant="full" />,
});
