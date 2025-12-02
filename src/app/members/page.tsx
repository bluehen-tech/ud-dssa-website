"use client";

import { useState } from 'react';
import Link from 'next/link';
import { officers, members, alumni, allMembers } from '@/data/members';
import type { MemberPortfolio } from '@/types/member';

type TabType = 'officers' | 'members' | 'alumni';

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('officers');

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
          <h1 className="text-4xl font-bold text-blue-primary mb-2">
            Members
          </h1>
          <p className="text-xl text-gray-600">
            Meet the talented members of the Data Science Student Association at UD.
          </p>
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
        {currentMembers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <p className="text-gray-600 mb-4">
              No {activeTab} portfolios available yet. Check back soon!
            </p>
            <p className="text-sm text-gray-500">
              Members can create their portfolios by copying the template file and adding their information.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-primary">
      <div className="flex flex-col items-center text-center mb-4">
        {member.profileImageUrl ? (
          <div className="w-24 h-24 rounded-full bg-gray-200 mb-3 overflow-hidden">
            <img
              src={member.profileImageUrl}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-blue-primary">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <h3 className="text-xl font-bold text-blue-primary mb-1">
          {member.name}
        </h3>
        
        {member.position && (
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {member.position}
          </p>
        )}
        
        {member.tagline && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {member.tagline}
          </p>
        )}
      </div>

      {member.bio && (
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
          {member.bio}
        </p>
      )}

      {member.skills && member.skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
            Skills
          </h4>
          <div className="flex flex-wrap gap-1">
            {member.skills.slice(0, 2).map((skillCategory, idx) => (
              <div key={idx} className="flex flex-wrap gap-1">
                {skillCategory.items.slice(0, 3).map((skill, skillIdx) => (
                  <span
                    key={skillIdx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {member.links && (
        <div className="flex justify-center gap-3 pt-4 border-t border-gray-200">
          {member.links.linkedin && (
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
          {member.links.github && (
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
          {member.links.website && (
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
          {member.links.email && (
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
      )}
    </div>
  );
}

