"use client";

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { opportunities } from '@/data/opportunities';
import { OpportunityType } from '@/types/opportunity';

export default function OpportunityDetailPage() {
  const params = useParams();
  const { session, isAdmin, isLoading } = useAuth();
  const id = params.id as string;

  const opportunity = opportunities.find(opp => opp.id === id);

  const getTypeColor = (type: OpportunityType): string => {
    const colors: Record<OpportunityType, string> = {
      job: 'bg-green-100 text-green-800 border-green-200',
      internship: 'bg-blue-100 text-blue-800 border-blue-200',
      project: 'bg-purple-100 text-purple-800 border-purple-200',
      research: 'bg-orange-100 text-orange-800 border-orange-200',
      event: 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no opportunity found
  if (!opportunity) {
    notFound();
  }

  // If no session, redirect to login
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-blue-primary mb-4">
              Sign In Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in with your UD email to view full opportunity details.
            </p>
            <Link
              href={`/login?redirect=/opportunities/${id}`}
              className="inline-block px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
            >
              Sign In
            </Link>
            <div className="mt-6">
              <Link
                href="/opportunities"
                className="text-blue-primary hover:text-blue-800 hover:underline"
              >
                ← Back to Opportunities
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userEmail = session.user.email;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/opportunities"
            className="inline-flex items-center text-blue-primary hover:text-blue-800 hover:underline"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Opportunities
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-blue-primary mb-2">
                  {opportunity.title}
                </h1>
                <p className="text-2xl text-gray-700 font-medium">
                  {opportunity.organization}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium border ${getTypeColor(
                  opportunity.type
                )}`}
              >
                {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
              </span>
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t border-b border-gray-200 py-4">
              {opportunity.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <strong>Location:</strong> {opportunity.location}
                </span>
              )}
              {opportunity.remote && (
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Remote Available
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <strong>Posted:</strong> {formatDate(opportunity.postedDate)}
              </span>
              {opportunity.deadline && (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <strong>Deadline:</strong> {formatDate(opportunity.deadline)}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              {opportunity.description}
            </p>
          </div>

          {/* Requirements */}
          {opportunity.requirements && opportunity.requirements.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Requirements</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                {opportunity.requirements.map((req, idx) => (
                  <li key={idx} className="text-lg">{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Skills & Technologies</h2>
              <div className="flex flex-wrap gap-2">
                {opportunity.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md border border-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            {opportunity.applicationUrl && (
              <a
                href={opportunity.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200 text-center text-lg"
              >
                Apply Now
              </a>
            )}
            {opportunity.contactEmail && (
              <a
                href={`mailto:${opportunity.contactEmail}`}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 text-center text-lg"
              >
                Contact via Email
              </a>
            )}
          </div>

          {/* User Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
            <p>
              <strong>Viewing as:</strong> {userEmail} {isAdmin && '(Admin)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

