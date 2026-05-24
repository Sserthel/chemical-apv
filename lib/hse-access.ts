"use client";

import { useEffect, useState } from "react";

const HSE_KEY = "kemisk-apv-hse";

export function enableHseAccess(): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(HSE_KEY, "1");
  }
}

export function useHseAccess(): boolean {
  const [hse, setHse] = useState(false);

  useEffect(() => {
    setHse(sessionStorage.getItem(HSE_KEY) === "1");
  }, []);

  return hse;
}
