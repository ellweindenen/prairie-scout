import { createFileRoute } from "@tanstack/react-router";
import { PrairieScout } from "@/components/prairie-scout";

export const Route = createFileRoute("/")({ component: PrairieScout });
