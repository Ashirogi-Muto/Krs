"use client";
import { useEffect, useState } from "react";

/** Name of this ledger instance ("Official" / "Unofficial"), from the backend's LEDGER_NAME. */
export function useLedgerName(): string {
  const [name, setName] = useState("");
  useEffect(() => {
    fetch("/api/instance")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.name && setName(String(d.name)))
      .catch(() => undefined);
  }, []);
  return name;
}
