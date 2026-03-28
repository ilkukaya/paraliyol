"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - in production, verify via API
    if (password === "paraliyol2026") {
      localStorage.setItem("admin-token", "authenticated");
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Hatalı şifre");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-token");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Admin Girişi
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Çıkış Yap
        </button>
      </div>
      <nav className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-green-300 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/fiyatlar"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-green-300 transition-colors"
        >
          Fiyat Yönetimi
        </Link>
        <Link
          href="/admin/gecis-noktalari"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-green-300 transition-colors"
        >
          Geçiş Noktaları
        </Link>
        <Link
          href="/admin/ayarlar"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-green-300 transition-colors"
        >
          Site Ayarları
        </Link>
      </nav>
      {children}
    </div>
  );
}
