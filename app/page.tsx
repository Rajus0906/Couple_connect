"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Item = {
  id: number;
  title: string;
  is_completed: boolean;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [doneCount, setDoneCount] = useState(0);
  const [title, setTitle] = useState("");
  const [undo, setUndo] = useState<Item | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    const { data } = await supabase
      .from("wishlist")
      .select("id,title,is_completed")
      .order("id");
    const all = (data as Item[]) ?? [];
    setItems(all.filter((i) => !i.is_completed));
    setDoneCount(all.filter((i) => i.is_completed).length);
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    await supabase.from("wishlist").insert({ title: t });
    setTitle("");
    load();
  }

  async function complete(item: Item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await supabase
      .from("wishlist")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", item.id);
    setUndo(item);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
    load();
  }

  async function undoComplete() {
    if (!undo) return;
    await supabase
      .from("wishlist")
      .update({ is_completed: false, completed_at: null })
      .eq("id", undo.id);
    setUndo(null);
    load();
  }

  async function remove(item: Item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await supabase.from("wishlist").delete().eq("id", item.id);
    load();
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent">Our Wishlist</h1>
        <Link
          href="/memories"
          className="rounded-full border border-line bg-card px-3 py-1 text-sm text-accent"
        >
          Memories ({doneCount})
        </Link>
      </header>

      <form onSubmit={addItem} className="mb-4 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a movie or date idea"
          className="flex-1 rounded-lg border border-line bg-card px-3 py-2 text-ink placeholder:text-muted"
        />
        <button className="rounded-lg bg-accent px-4 py-2 text-white">Add</button>
      </form>

      {items.length === 0 && (
        <p className="text-muted">Nothing on the list. Add something you want to do together!</p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-card p-3"
          >
            <input
              type="checkbox"
              checked={false}
              onChange={() => complete(item)}
              className="h-5 w-5 accent-accent"
            />
            <span className="flex-1 text-ink">{item.title}</span>
            <button
              onClick={() => remove(item)}
              aria-label={`Delete ${item.title}`}
              className="px-1 text-muted"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {undo && (
        <div className="fixed inset-x-4 bottom-4 mx-auto flex max-w-md items-center justify-between rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg">
          <span>Moved to Memories</span>
          <button onClick={undoComplete} className="font-semibold underline">
            Undo
          </button>
        </div>
      )}
    </main>
  );
}