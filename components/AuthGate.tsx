"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }

  if (!ready) return null;

  if (!session) {
    return (
      <main className="mx-auto max-w-md p-4">
        <h1 className="mb-4 text-2xl font-bold text-accent">Our Wishlist</h1>
        <form onSubmit={signIn} className="space-y-2">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-line bg-card px-3 py-2 text-ink placeholder:text-muted"
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-line bg-card px-3 py-2 text-ink placeholder:text-muted"
          />
          <button className="w-full rounded-lg bg-accent px-4 py-2 text-white">Sign in</button>
          {error && <p className="text-sm text-muted">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <>
      {children}
      <div className="mx-auto max-w-md p-4 text-center">
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-muted underline"
        >
          Sign out
        </button>
      </div>
    </>
  );
}