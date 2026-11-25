"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Memory = {
  id: number;
  title: string;
  completed_at: string;
  photo_paths: string[] | null;
};

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    const { data } = await supabase
      .from("wishlist")
      .select("id,title,completed_at,photo_paths")
      .eq("is_completed", true)
      .order("completed_at", { ascending: false });
    const list = (data as Memory[]) ?? [];
    setMemories(list);

    const paths = list.flatMap((m) => m.photo_paths ?? []);
    if (paths.length) {
      const { data: urls } = await supabase.storage
        .from("memories")
        .createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      urls?.forEach((u) => {
        if (u.path && u.signedUrl) map[u.path] = u.signedUrl;
      });
      setSigned(map);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addPhotos(memory: Memory, files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusyId(memory.id);
    const paths = [...(memory.photo_paths ?? [])];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${memory.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("memories").upload(path, file);
      if (error) {
        alert(error.message);
        continue;
      }
      paths.push(path);
    }
    await supabase.from("wishlist").update({ photo_paths: paths }).eq("id", memory.id);
    setBusyId(null);
    load();
  }

  async function restore(m: Memory) {
    await supabase
      .from("wishlist")
      .update({ is_completed: false, completed_at: null })
      .eq("id", m.id);
    load();
  }

  async function remove(m: Memory) {
    if (!confirm(`Delete "${m.title}" and its photos forever?`)) return;
    const paths = m.photo_paths ?? [];
    if (paths.length) await supabase.storage.from("memories").remove(paths);
    await supabase.from("wishlist").delete().eq("id", m.id);
    load();
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent">Our Memories</h1>
        <Link
          href="/"
          className="rounded-full border border-line bg-card px-3 py-1 text-sm text-accent"
        >
          Back
        </Link>
      </header>

      {memories.length === 0 && (
        <p className="text-muted">Nothing here yet. Check something off your wishlist!</p>
      )}

      <ul className="space-y-4">
        {memories.map((m) => (
          <li key={m.id} className="rounded-xl border border-line bg-card p-3">
            <div className="font-medium text-ink">{m.title}</div>
            <div className="mb-2 text-sm text-muted">
              {new Date(m.completed_at).toLocaleDateString()}
            </div>
            <div className="mb-2 grid grid-cols-3 gap-2">
              {(m.photo_paths ?? []).map(
                (p) =>
                  signed[p] && (
                    <img
                      key={p}
                      src={signed[p]}
                      alt=""
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  )
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="cursor-pointer text-accent underline">
                {busyId === m.id ? "Uploading..." : "Add photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addPhotos(m, e.target.files)}
                />
              </label>
              <button onClick={() => restore(m)} className="text-muted underline">
                Move back to wishlist
              </button>
              <button onClick={() => remove(m)} className="text-muted underline">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}