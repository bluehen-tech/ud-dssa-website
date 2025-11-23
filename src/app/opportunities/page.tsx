"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { opportunities } from '@/data/opportunities';
import { OpportunityType } from '@/types/opportunity';

export default function OpportunitiesPage() {
  const { session, isAdmin, isLoading } = useAuth();

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

  // If no session, show obscured opportunities preview
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
            <div className="mb-4">
              <h1 className="text-4xl font-bold text-blue-primary mb-2">
                Opportunities
              </h1>
              <p className="text-xl text-gray-600">
                Career, internship, and project opportunities curated for DSSA members.
              </p>
            </div>
          </div>

          {/* Sign In Prompt */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-primary p-8 rounded-lg shadow-lg text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-2xl font-bold text-blue-primary">
                Sign In to Access Full Details
              </h2>
            </div>
            <p className="text-gray-700 mb-6 text-lg">
              Sign in with your <strong>@udel.edu</strong> email to view complete opportunity details and apply.
            </p>
            <Link
              href="/login?redirect=/opportunities"
              className="inline-block px-8 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200 shadow-md"
            >
              Sign In with UD Email
            </Link>
          </div>

          {/* Obscured Opportunities Preview */}
          {opportunities.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <p className="text-gray-600 mb-4">No opportunities available at this time. Check back soon!</p>
              <p className="text-sm text-gray-600 pt-4 border-t border-gray-200">
                <strong>Employers:</strong> Have an opportunity to share? Contact us at{' '}
                <a href="mailto:dsi-info@udel.edu" className="text-blue-primary hover:text-blue-800 hover:underline font-medium">
                  dsi-info@udel.edu
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {opportunities.map((opportunity) => (
                <Link
                  key={opportunity.id}
                  href={`/opportunities/${opportunity.id}`}
                  className="block bg-white p-6 rounded-lg shadow-md border-2 border-gray-200 relative overflow-hidden hover:border-blue-primary hover:shadow-xl transition-all duration-300"
                >
                  {/* Overlay to indicate locked content */}
                  <div className="absolute top-2 right-2 bg-blue-primary text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Sign in to view
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div>
                          <h2 className="text-2xl font-bold text-blue-primary mb-1">
                            {opportunity.title}
                          </h2>
                          <p className="text-lg text-gray-700 font-medium">
                            {opportunity.organization}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(
                            opportunity.type
                          )}`}
                        >
                          {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        {opportunity.location && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {opportunity.location}
                          </span>
                        )}
                        {opportunity.remote && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Remote Available
                          </span>
                        )}
                        {opportunity.deadline && (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Deadline: {formatDate(opportunity.deadline)}
                          </span>
                        )}
                      </div>

                      {/* Blurred preview text */}
                      <div className="relative">
                        <p className="text-gray-700 blur-sm select-none">
                          {opportunity.description}
                        </p>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-white px-4 py-2 rounded-md shadow-md text-sm font-medium text-gray-700">
                            Sign in to view details
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[200px]">
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-300 text-gray-500 font-medium rounded-md cursor-not-allowed opacity-60"
                      >
                        Sign In to Apply
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Employer Callout */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-md text-center mt-6 border border-blue-200">
            <p className="text-gray-700">
              <strong className="text-blue-primary">Employers:</strong> Have a job, internship, project, or research opportunity to share with UD students?{' '}
              <a href="mailto:dsi-info@udel.edu" className="text-blue-primary hover:text-blue-800 hover:underline font-medium">
                Contact us at dsi-info@udel.edu
              </a>
            </p>
          </div>

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

  const userEmail = session.user.email;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-blue-primary mb-2">
                Opportunities
              </h1>
              <p className="text-xl text-gray-600">
                Career, internship, and project opportunities curated for DSSA members.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Signed in as:</strong> {userEmail}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isAdmin ? 'Admin' : 'Member'}
              </p>
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        {opportunities.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <p className="text-gray-600 mb-4">No opportunities available at this time. Check back soon!</p>
            <p className="text-sm text-gray-600 pt-4 border-t border-gray-200">
              <strong>Employers:</strong> Have an opportunity to share? Contact us at{' '}
              <a href="mailto:dsi-info@udel.edu" className="text-blue-primary hover:text-blue-800 hover:underline font-medium">
                dsi-info@udel.edu
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {opportunities.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/opportunities/${opportunity.id}`}
                className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:border-blue-primary hover:border-2 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div>
                        <h2 className="text-2xl font-bold text-blue-primary mb-1">
                          {opportunity.title}
                        </h2>
                        <p className="text-lg text-gray-700 font-medium">
                          {opportunity.organization}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(
                          opportunity.type
                        )}`}
                      >
                        {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{opportunity.description}</p>

                    {opportunity.requirements && opportunity.requirements.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Requirements:</h3>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {opportunity.requirements.map((req, idx) => (
                            <li key={idx} className="text-sm">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      {opportunity.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {opportunity.location}
                        </span>
                      )}
                      {opportunity.remote && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Remote Available
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Posted: {formatDate(opportunity.postedDate)}
                      </span>
                      {opportunity.deadline && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Deadline: {formatDate(opportunity.deadline)}
                        </span>
                      )}
                    </div>

                    {opportunity.tags && opportunity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {opportunity.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:min-w-[200px]">
                    {opportunity.applicationUrl && (
                      <a
                        href={opportunity.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200 text-center"
                      >
                        Apply Now
                      </a>
                    )}
                    {opportunity.contactEmail && (
                      <a
                        href={`mailto:${opportunity.contactEmail}`}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 text-center"
                      >
                        Contact
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Employer Callout */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-md text-center mt-6 border border-blue-200">
          <p className="text-gray-700">
            <strong className="text-blue-primary">Employers:</strong> Have a job, internship, project, or research opportunity to share with UD students?{' '}
            <a href="mailto:dsi-info@udel.edu" className="text-blue-primary hover:text-blue-800 hover:underline font-medium">
              Contact us at dsi-info@udel.edu
            </a>
          </p>
        </div>

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
