"use client";
import { useEffect, useState } from "react";
import { api } from "./api";

export type MenuItem = { id: number; slug: string; category: string; emoji: string; price: number; allergens: string[]; names: Record<string, string>; descriptions: Record<string, string> };

export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<{ items: MenuItem[] }>("/api/menu").then((d) => setItems(d.items)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  return { items, loading };
}
