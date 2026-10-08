"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 1. Connect to your Supabase project
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define the shape of our data
interface WishlistItem {
  id: number;
  title: string;
  is_completed: boolean;
}

export default function Home() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [newItem, setNewItem] = useState("");

  // 2. Fetch ideas as soon as the app loads
  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    const { data, error } = await supabase
      .from("wishlist")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      setWishlist(data || []);
    }
  };

  // 3. Add a new date idea to the database
  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const { data, error } = await supabase
      .from("wishlist")
      .insert([{ title: newItem }])
      .select();

    if (error) {
      console.error("Error adding item:", error);
    } else if (data) {
      // Update the screen instantly with the new item
      setWishlist([...wishlist, data[0]]);
      setNewItem(""); 
    }
  };

  // 4. Toggle the checkbox (mark as done or undone)
  const toggleComplete = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from("wishlist")
      .update({ is_completed: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating item:", error);
    } else {
      // Update the UI instantly so it feels snappy
      setWishlist(
        wishlist.map((item) =>
          item.id === id ? { ...item, is_completed: !currentStatus } : item
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 p-6">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-6">
        <div className="text-2xl font-bold text-center text-rose-500 mb-6">
          Our Date Night Ideas
        </div>

        {/* Input Form */}
        <form onSubmit={addItem} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add a movie or date idea..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            type="submit"
            className="bg-rose-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-rose-600 transition"
          >
            Add
          </button>
        </form>

        {/* Wishlist Display */}
        <ul className="space-y-3">
          {wishlist.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
            >
              <input
                type="checkbox"
                checked={item.is_completed}
                onChange={() => toggleComplete(item.id, item.is_completed)}
                className="w-5 h-5 text-rose-500 rounded focus:ring-rose-400"
              />
              <span
                className={`text-lg ${
                  item.is_completed ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {item.title}
              </span>
            </li>
          ))}
          {wishlist.length === 0 && (
            <div className="text-center text-gray-400 mt-4">
              No ideas yet. Add one above!
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}