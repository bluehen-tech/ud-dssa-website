"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-hen">
                UDSSA
              </Link>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/about" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-hen">
                About
              </Link>
              <Link href="/events" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-hen">
                Events
              </Link>
              <Link href="/members" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-hen">
                Members
              </Link>
              <Link href="/services" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-hen">
                Services
              </Link>
              <Link href="/contact" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-hen">
                Contact
              </Link>
            </nav>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center">
            <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-hen bg-white hover:bg-gray-50">
              Log in
            </Link>
            <Link href="/join" className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-hen hover:bg-blue-800">
              Join Us
            </Link>
          </div>
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-hen"
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

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/about" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-hen hover:text-blue-hen">
              About
            </Link>
            <Link href="/events" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-hen hover:text-blue-hen">
              Events
            </Link>
            <Link href="/members" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-hen hover:text-blue-hen">
              Members
            </Link>
            <Link href="/services" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-hen hover:text-blue-hen">
              Services
            </Link>
            <Link href="/contact" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-hen hover:text-blue-hen">
              Contact
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <Link href="/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-hen bg-white hover:bg-gray-50">
                  Log in
                </Link>
              </div>
              <div className="ml-3">
                <Link href="/join" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-hen hover:bg-blue-800">
                  Join Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 