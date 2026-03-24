"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/images/dssa-logo.png";

function formatCompact(n: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

// GitHub icon button — always visible at all screen sizes
function GitHubButton() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/github-stars", { cache: "no-store" });
        const json = await res.json();
        if (!ignore) setStars(typeof json?.stars === "number" ? json.stars : null);
      } catch {
        if (!ignore) setStars(null);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  return (
    <a
      href="https://github.com/bluehen-tech/ud-dssa-website"
      target="_blank"
      rel="noreferrer"
      title="GitHub"
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
      {/* Star count — hidden on very small screens */}
      {typeof stars === "number" && (
        <span className="hidden sm:inline font-medium">{formatCompact(stars)}</span>
      )}
    </a>
  );
}

// Admin-only "More" dropdown for desktop nav
function MoreDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center px-1 pt-1 text-sm font-medium leading-5 text-gray-700 hover:text-blue-primary"
        type="button"
      >
        <span>More</span>
        <span className="ml-1 text-[10px] leading-none text-gray-500">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-44 rounded-md border bg-white shadow-lg">
          <div className="py-1">
            <Link href="/contacts" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-primary">Contacts</Link>
            <Link href="/email" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-primary">Email</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { session, isAdmin, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const scrollToForm = () => {
    setIsMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById("contact-form");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const coreNavLinks = [
    { label: "Home", href: "/" },
    { label: "Events", href: "/events" },
    { label: "Opportunities", href: "/opportunities" },
    { label: "Members", href: "/members" },
  ];

  const adminMoreItems = [
    { label: "Contacts", href: "/contacts" },
    { label: "Email", href: "/email" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">

            {/* ── LEFT: Logo ── */}
            <div className="flex items-center min-w-0 flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity overflow-hidden rounded-sm">
                  <Image src={logo} alt="DSSA Logo" fill sizes="44px" className="object-cover object-top" priority />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-blue-primary leading-tight truncate">
                    <span className="text-base inline sm:hidden">DSSA</span>
                    <span className="text-lg hidden sm:inline lg:hidden">DSSA @ UD</span>
                    <span className="text-xl hidden lg:inline">DSSA @ University of Delaware</span>
                  </span>
                  <span className="text-xs text-gray-500 leading-tight hidden md:block">bluehen-dssa.org</span>
                </div>
              </Link>
            </div>

            {/* ── CENTER: Desktop nav links (hidden below md) ── */}
            <nav className="hidden md:flex items-center space-x-5 lg:space-x-8 flex-1 justify-center">
              {coreNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-blue-primary whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && <MoreDropdown />}
            </nav>

            {/* ── RIGHT: Always-visible actions + hamburger ── */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* GitHub — always visible at every width */}
              <GitHubButton />

              {/* Primary CTA — always visible */}
              {session ? (
                <>
                  {/* Role badge only on md+ */}
                  <span className="hidden md:block text-xs text-gray-400 whitespace-nowrap">
                    {isAdmin ? "Admin" : "Member"}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-full hover:bg-gray-300 transition-colors whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  {/* Sign In text link — only md+ to save space */}
                  <Link
                    href="/login"
                    className="hidden md:inline px-3 py-1.5 text-blue-primary text-sm font-medium rounded-full hover:text-blue-800 transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  {/* Get Connected — always visible, shorter label on tiny screens */}
                  <button
                    onClick={scrollToForm}
                    className="px-3 py-1.5 bg-blue-primary text-white text-xs sm:text-sm font-medium rounded-full hover:bg-blue-800 transition-colors whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Get Connected</span>
                    <span className="sm:hidden">Join</span>
                  </button>
                </>
              )}

              {/* Hamburger — always visible */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-primary"
                aria-label="Toggle menu"
              >
                {!isMenuOpen ? (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── SIDEBAR OVERLAY (backdrop) ── */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── SIDEBAR PANEL (slides in from right) ── */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Navigation menu"
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 h-16">
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Navigation</span>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable nav content */}
        <nav className="flex-1 overflow-y-auto py-2">

          {/* Core nav links */}
          {coreNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center pl-4 pr-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-primary border-l-4 border-transparent hover:border-blue-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Admin-only More section */}
          {isAdmin && (
            <div className="mt-3">
              <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                More
              </div>
              {adminMoreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center pl-4 pr-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-primary border-l-4 border-transparent hover:border-blue-primary transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          <div className="my-2 border-t border-gray-100" />

          {/* Auth section in sidebar */}
          {session ? (
            <div className="px-4 py-3">
              <div className="text-sm text-gray-600 truncate">{session.user.email}</div>
              <div className="text-xs text-gray-400 mt-0.5 mb-3">{isAdmin ? "Admin" : "Member"}</div>
              <button
                onClick={handleLogout}
                className="w-full text-center py-2 px-4 bg-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 space-y-2">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full text-center py-2 px-4 border border-blue-primary text-blue-primary text-sm font-medium rounded-full hover:bg-blue-50 transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={scrollToForm}
                className="w-full py-2 px-4 bg-blue-primary text-white text-sm font-medium rounded-full hover:bg-blue-800 transition-colors"
              >
                Get Connected
              </button>
            </div>
          )}
        </nav>

        {/* Sidebar footer: GitHub link */}
        <div className="border-t border-gray-100 px-4 py-3">
          <a
            href="https://github.com/bluehen-tech/ud-dssa-website"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4 flex-shrink-0" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span>View on GitHub</span>
          </a>
        </div>
      </aside>
    </>
  );
}
