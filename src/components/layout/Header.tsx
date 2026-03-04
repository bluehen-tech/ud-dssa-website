"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/images/dssa-logo.png";

function formatCompact(n: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

function GitHubStars() {
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
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <a
      href="https://github.com/bluehen-tech/ud-dssa-website"
      target="_blank"
      rel="noreferrer"
      className="hidden sm:inline-flex h-8 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      title="GitHub"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>

      <span className="font-medium">{typeof stars === "number" ? formatCompact(stars) : "—"}</span>
    </a>
  );
}

function MoreDropdown({
  isAdmin,
  closeMenu,
}: {
  isAdmin: boolean;
  closeMenu?: () => void;
}) {
  return (
    <div className="relative group">
      <button
        className="inline-flex items-center px-1 pt-1 text-sm font-medium leading-5 text-gray-700 hover:text-blue-primary"
        type="button"
      >
        <span>More</span>
        <span className="ml-1 text-[10px] leading-none text-gray-500">▾</span>
      </button>

      <div
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition
                   absolute left-0 top-full z-50 mt-2 min-w-44 rounded-md border bg-white shadow-lg"
      >
        <div className="py-1">
          <Link
            href="/contacts"
            onClick={closeMenu}
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-primary"
          >
            Contacts
          </Link>

          {isAdmin && (
            <Link
              href="/email"
              onClick={closeMenu}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-primary"
            >
              Email
            </Link>
          )}
        </div>
      </div>
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
    setTimeout(() => {
      const formElement = document.getElementById("contact-form");
      if (formElement) {
        formElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const mobileMoreItems = useMemo(() => {
    const items = [{ label: "Contacts", href: "/contacts" }];
    if (isAdmin) items.push({ label: "Email", href: "/email" });
    return items;
  }, [isAdmin]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-12 h-12 flex-shrink-0 opacity-90 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
                  <Image
                    src={logo}
                    alt="DSSA Logo"
                    fill
                    sizes="48px"
                    className="object-cover object-top"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-blue-primary leading-tight">
                    <span className="md:hidden">DSSA @ UD</span>
                    <span className="hidden md:inline">DSSA @ University of Delaware</span>
                  </span>
                  <span className="text-xs text-gray-500 leading-tight">bluehen-dssa.org</span>
                </div>
              </Link>
            </div>

            <nav className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
            
              <Link href="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-primary">
                Home
              </Link>
              <Link href="/events" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-primary">
                Events
              </Link>
              <Link href="/opportunities" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-primary">
                Opportunities
              </Link>
              <Link href="/members" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-primary">
                Members
              </Link>

              {/* ✅ More dropdown (Contacts always, Email admin-only) */}
              <MoreDropdown isAdmin={isAdmin} />
            </nav>
          </div>

          {/* Desktop right actions */}
          <div className="hidden md:flex md:items-center gap-3">
            <GitHubStars />

            {session ? (
              <>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-600">{session.user.email}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{isAdmin ? "Admin" : "Member"}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-300 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-blue-primary text-sm font-medium rounded-full hover:text-blue-800 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <button
                  onClick={scrollToForm}
                  className="px-3 py-1.5 bg-blue-primary text-white text-sm font-medium rounded-full hover:bg-blue-800 transition-colors duration-200"
                >
                  Get Connected
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-primary"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
            >
              Home
            </Link>
            <Link
              href="/events"
              onClick={() => setIsMenuOpen(false)}
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
            >
              Events
            </Link>
            <Link
              href="/opportunities"
              onClick={() => setIsMenuOpen(false)}
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
            >
              Opportunities
            </Link>
            <Link
              href="/members"
              onClick={() => setIsMenuOpen(false)}
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
            >
              Members
            </Link>

            {/* Mobile "More" section */}
            <div className="pt-2">
              <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                More
              </div>
              {mobileMoreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Small GitHub link for mobile */}
            <a
              href="https://github.com/bluehen-tech/ud-dssa-website"
              target="_blank"
              rel="noreferrer"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
            >
              GitHub
            </a>

            {session ? (
              <>
                <div className="block pl-3 pr-4 py-2 text-sm text-gray-600">
                  <div>{session.user.email}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{isAdmin ? "Admin" : "Member"}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-primary hover:text-blue-primary"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => {
                    scrollToForm();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white bg-blue-primary hover:bg-blue-800 transition-colors duration-200"
                >
                  Get Connected
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}