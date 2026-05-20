import React from "react";
import type { Message, SimulationPlan } from "../types";
import { persistWorkbenchSnapshot } from "./workbenchStorage";

export const useDebouncedWorkbenchPersistence = ({
  storageKey,
  plan,
  messages,
  delay = 600,
}: {
  storageKey: string;
  plan: SimulationPlan;
  messages: Message[];
  delay?: number;
}) => {
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      persistWorkbenchSnapshot(storageKey, plan, messages);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delay, messages, plan, storageKey]);
};
