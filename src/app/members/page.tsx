"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { MemberPortfolio } from '@/types/member';

type TabType = 'officers' | 'members' | 'alumni';

export default function MembersPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('officers');
  const [portfolios, setPortfolios] = useState<MemberPortfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/member-portfolios')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && Array.isArray(data.portfolios)) {
          setPortfolios(data.portfolios);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const officers = portfolios.filter((p) => p.role === 'officer');
  const members = portfolios.filter((p) => p.role === 'member');
  const alumni = portfolios.filter((p) => p.role === 'alumni');

  const getCurrentMembers = (): MemberPortfolio[] => {
    switch (activeTab) {
      case 'officers':
        return officers;
      case 'members':
        return members;
      case 'alumni':
        return alumni;
      default:
        return [];
    }
  };

  const currentMembers = getCurrentMembers();

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-blue-primary mb-2">
                Members
              </h1>
              <p className="text-xl text-gray-600">
                Meet the talented members of the Data Science Student Association at UD.
              </p>
            </div>
            {session && (
              <Link
                href="/members/me"
                className="inline-flex items-center px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
              >
                My portfolio
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('officers')}
              className={`px-6 py-2 font-medium rounded-t-lg transition-colors duration-200 ${
                activeTab === 'officers'
                  ? 'bg-blue-primary text-white border-b-2 border-blue-primary'
                  : 'text-gray-600 hover:text-blue-primary hover:bg-gray-50'
              }`}
            >
              Officers ({officers.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-2 font-medium rounded-t-lg transition-colors duration-200 ${
                activeTab === 'members'
                  ? 'bg-blue-primary text-white border-b-2 border-blue-primary'
                  : 'text-gray-600 hover:text-blue-primary hover:bg-gray-50'
              }`}
            >
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('alumni')}
              className={`px-6 py-2 font-medium rounded-t-lg transition-colors duration-200 ${
                activeTab === 'alumni'
                  ? 'bg-blue-primary text-white border-b-2 border-blue-primary'
                  : 'text-gray-600 hover:text-blue-primary hover:bg-gray-50'
              }`}
            >
              Alumni ({alumni.length})
            </button>
          </div>
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <p className="text-gray-600">Loading members...</p>
          </div>
        ) : currentMembers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <p className="text-gray-600 mb-4">
              No {activeTab} portfolios available yet. Check back soon!
            </p>
            <p className="text-sm text-gray-500">
              {session ? 'Create your portfolio using the button above.' : 'Sign in with your @udel.edu email to create your portfolio.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {currentMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="px-4 py-2 text-blue-primary hover:text-blue-800 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: MemberPortfolio }) {
  const skills = member.skills.flatMap((category) => category.items);

  return (
    <article className="member-card relative isolate flex h-[30rem] w-full max-w-[22rem] min-w-0 flex-col rounded-2xl border border-gray-200 p-6 shadow-md">
      <div aria-hidden="true" className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-blue-primary via-blue-400 to-gold" />
      <div className="mb-4 flex h-40 shrink-0 flex-col items-center text-center">
        {member.profileImageUrl ? (
          <div className="member-card-avatar mb-2 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-200 ring-4 ring-white shadow-md">
            <img
              src={member.profileImageUrl}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="member-card-avatar mb-2 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white shadow-md">
            <span className="text-3xl font-bold text-blue-primary">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <h3 className="mb-1 w-full shrink-0 truncate text-xl font-bold text-blue-primary" title={member.name}>
          {member.name}
        </h3>
        
        {member.position && (
          <p className="w-full line-clamp-2 break-words text-sm font-medium text-gray-600">
            {member.position}
          </p>
        )}
      </div>

      <div className="mb-4 h-[3.75rem] shrink-0">
        <p className="line-clamp-3 break-words text-sm leading-5 text-gray-600">
          {member.tagline || member.bio}
        </p>
      </div>

      <div className="h-[5.25rem] shrink-0 overflow-hidden">
        {skills.length > 0 && (
          <>
            <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
              Skills
            </h4>
            <div className="flex flex-wrap gap-1" aria-label={`${skills.length} skills; view the full portfolio for all skills`}>
              {skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="max-w-[calc(50%-2px)] truncate rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-primary">
                  {skill}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-auto border-t border-gray-200 pt-3">
        <Link href={`/members/${member.id}`} className="member-card-link flex items-center justify-between text-sm font-semibold text-blue-primary" aria-label={`View ${member.name}'s full portfolio`}>
          View full portfolio
          <svg aria-hidden="true" className="member-card-arrow h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </Link>

        <div className="member-card-socials mt-2 flex h-8 justify-center gap-2">
          {member.links?.linkedin && (
            <a
              href={member.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
              aria-label={`${member.name}'s LinkedIn`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          )}
          {member.links?.github && (
            <a
              href={member.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-gray-600 transition-colors"
              aria-label={`${member.name}'s GitHub`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
              </svg>
            </a>
          )}
          {member.links?.website && (
            <a
              href={member.links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
              aria-label={`${member.name}'s Website`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </a>
          )}
          {(member.contactPreferences?.allowPublicEmail ?? true) && member.links?.email && (
            <a
              href={`mailto:${member.links.email}`}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              aria-label={`Email ${member.name}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

