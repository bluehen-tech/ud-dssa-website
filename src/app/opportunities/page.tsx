"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { opportunities } from '@/data/opportunities';
import { OpportunityType } from '@/types/opportunity';
import { useOpportunityResumes } from '@/hooks/useOpportunityResumes';
import { useApplications } from '@/hooks/useApplications';
import ResumeUploadModal from '@/components/ResumeUploadModal';

export default function OpportunitiesPage() {
  const { session, isAdmin, isLoading } = useAuth();
  const {
    resumesByOpportunity,
    isLoading: isResumeLoading,
    isUploading,
    error: resumeError,
    uploadResume,
    deleteResume,
    downloadResume,
    getResumeForOpportunity,
  } = useOpportunityResumes();
  
  const {
    applications,
    isLoading: isApplicationsLoading,
    hasApplied,
    applyToOpportunity,
    withdrawApplication,
  } = useApplications();
  
  const [resumeModalOpportunityId, setResumeModalOpportunityId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = useState<string | null>(null);
  const [applyingToId, setApplyingToId] = useState<string | null>(null);

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

  const handleUploadResume = async (file: File): Promise<boolean> => {
    if (!resumeModalOpportunityId) return false;
    const success = await uploadResume(resumeModalOpportunityId, file);
    if (success) {
      setResumeModalOpportunityId(null);
      return true;
    }
    return false;
  };

  const handleDeleteResume = async () => {
    if (!deleteConfirmId) return;
    const success = await deleteResume(deleteConfirmId);
    if (success) {
      setDeleteConfirmId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleApply = async (opportunityId: string) => {
    const opportunityResume = getResumeForOpportunity(opportunityId);

    if (!opportunityResume) {
      alert('Please upload a resume for this opportunity before applying.');
      setResumeModalOpportunityId(opportunityId);
      return;
    }

    setApplyingToId(opportunityId);
    const success = await applyToOpportunity(opportunityId, opportunityResume.id);
    setApplyingToId(null);

    if (success) {
      // Success - application tracked
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawConfirmId) return;
    
    const success = await withdrawApplication(withdrawConfirmId);
    if (success) {
      setWithdrawConfirmId(null);
    }
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
  const opportunityForUpload = resumeModalOpportunityId
    ? opportunities.find((opp) => opp.id === resumeModalOpportunityId)
    : null;
  const opportunityPendingDeletion = deleteConfirmId
    ? opportunities.find((opp) => opp.id === deleteConfirmId)
    : null;
  const resumePendingDeletion = deleteConfirmId ? resumesByOpportunity[deleteConfirmId] : null;

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

          {/* Opportunity Resume Overview */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-blue-primary">Opportunity Resumes</h3>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Attach a tailored resume to each opportunity. Use the buttons on every listing to upload, replace, or delete that specific file.
                </p>

                {isResumeLoading ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Loading resume status...</span>
                  </div>
                ) : Object.keys(resumesByOpportunity).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(resumesByOpportunity).map(([opportunityId, opportunityResume]) => {
                      const associatedOpportunity = opportunities.find((opp) => opp.id === opportunityId);
                      return (
                        <div
                          key={opportunityId}
                          className="bg-white/70 border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {associatedOpportunity ? associatedOpportunity.title : 'Opportunity removed'}
                            </p>
                            <p className="text-sm text-gray-700">{opportunityResume.file_name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded{' '}
                              {new Date(opportunityResume.uploaded_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}{' '}
                              • {formatFileSize(opportunityResume.file_size)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => downloadResume(opportunityId)}
                              className="px-3 py-1.5 bg-white border border-blue-primary text-blue-primary text-xs font-medium rounded-md hover:bg-blue-50 transition-colors"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => setResumeModalOpportunityId(opportunityId)}
                              className="px-3 py-1.5 bg-blue-primary text-white text-xs font-medium rounded-md hover:bg-blue-800 transition-colors"
                            >
                              Replace
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(opportunityId)}
                              className="px-3 py-1.5 bg-white border border-red-500 text-red-500 text-xs font-medium rounded-md hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white/70 border border-dashed border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      No resumes attached yet. Open any opportunity below and use the “Attach Resume” button to upload a version
                      crafted for that role.
                    </p>
                  </div>
                )}

                {resumeError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{resumeError}</p>
                  </div>
                )}
              </div>
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
            {opportunities.map((opportunity) => {
              const applied = hasApplied(opportunity.id);
              const applying = applyingToId === opportunity.id;
              const opportunityResume = resumesByOpportunity[opportunity.id];
              const canApply = Boolean(opportunityResume);
              const resumeUploadedAtLabel = opportunityResume
                ? new Date(opportunityResume.uploaded_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;
              
              return (
                <div
                  key={opportunity.id}
                  className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-primary"
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

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Resume for this opportunity</p>
                          {opportunityResume ? (
                            <>
                              <p className="font-medium text-gray-900">{opportunityResume.file_name}</p>
                              <p className="text-xs text-gray-500">
                                Uploaded {resumeUploadedAtLabel} • {formatFileSize(opportunityResume.file_size)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-700">
                              No resume attached yet. Upload a tailored version before applying.
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                            opportunityResume
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {opportunityResume ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Attached
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Required
                            </>
                          )}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {opportunityResume ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadResume(opportunity.id);
                              }}
                              className="px-3 py-1.5 bg-white border border-blue-primary text-blue-primary text-xs font-medium rounded-md hover:bg-blue-50 transition-colors"
                            >
                              Download
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setResumeModalOpportunityId(opportunity.id);
                              }}
                              className="px-3 py-1.5 bg-blue-primary text-white text-xs font-medium rounded-md hover:bg-blue-800 transition-colors"
                            >
                              Replace
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(opportunity.id);
                              }}
                              className="px-3 py-1.5 bg-white border border-red-500 text-red-500 text-xs font-medium rounded-md hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setResumeModalOpportunityId(opportunity.id);
                            }}
                            className="px-4 py-2 bg-blue-primary text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors"
                          >
                            Attach Resume
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:min-w-[200px]">
                    {applied ? (
                      <>
                        <div className="px-4 py-2 bg-green-50 border-2 border-green-500 text-green-700 font-medium rounded-md text-center flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Applied
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWithdrawConfirmId(opportunity.id);
                          }}
                          className="px-4 py-2 bg-white border border-red-500 text-red-500 font-medium rounded-md hover:bg-red-50 transition-colors text-sm"
                        >
                          Withdraw Application
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(opportunity.id);
                          }}
                          disabled={applying || !canApply}
                          className="px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {applying ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Applying...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {canApply ? 'Apply Now' : 'Attach Resume to Apply'}
                            </>
                          )}
                        </button>
                        {!canApply && (
                          <p className="text-xs text-orange-600 text-center">
                            Upload a resume for this opportunity to unlock the Apply button.
                          </p>
                        )}
                      </>
                    )}
                    {opportunity.applicationUrl && (
                      <a
                        href={opportunity.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors duration-200 text-center text-sm"
                      >
                        External Link
                      </a>
                    )}
                    {opportunity.contactEmail && (
                      <a
                        href={`mailto:${opportunity.contactEmail}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors duration-200 text-center text-sm"
                      >
                        Contact
                      </a>
                    )}
                    <Link
                      href={`/opportunities/${opportunity.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 bg-white border border-blue-primary text-blue-primary font-medium rounded-md hover:bg-blue-50 transition-colors duration-200 text-center text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
            })}
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

        {/* Resume Upload Modal */}
        <ResumeUploadModal
          isOpen={Boolean(resumeModalOpportunityId)}
          onClose={() => setResumeModalOpportunityId(null)}
          onUpload={handleUploadResume}
          isUploading={isUploading}
          opportunityTitle={opportunityForUpload?.title}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Resume for {opportunityPendingDeletion ? opportunityPendingDeletion.title : 'this opportunity'}?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Are you sure you want to delete{' '}
                    {opportunityPendingDeletion ? `the resume attached to ${opportunityPendingDeletion.title}` : 'this resume'}
                    ? You will need to upload a new version before applying again.
                  </p>
                  {resumePendingDeletion?.file_name && (
                    <p className="text-sm text-gray-500 mt-2">
                      Current file: <span className="font-medium">{resumePendingDeletion.file_name}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteResume}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Resume
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Application Confirmation Modal */}
        {withdrawConfirmId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Withdraw Application?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Are you sure you want to withdraw your application? This will remove your application from this opportunity.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setWithdrawConfirmId(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  className="px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 transition-colors"
                >
                  Withdraw Application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
