"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase-browser';
import { opportunities } from '@/data/opportunities';

interface ApplicationWithUser {
  id: string;
  opportunity_id: string;
  applied_at: string;
  status: string;
  notes: string | null;
  email: string;
  resume_file_name: string | null;
  resume_file_path: string | null;
  resume_file_size: number | null;
  resume_uploaded_at: string | null;
}

export default function ApplicationsAdminPage() {
  const { session, isAdmin, isLoading } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithUser[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string>('all');
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session && isAdmin) {
      fetchApplications();
    }
  }, [session, isAdmin]);

  const fetchApplications = async () => {
    try {
      setIsLoadingApps(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await (supabase as any)
        .from('applications_with_user_info')
        .select('*')
        .order('applied_at', { ascending: false });

      if (fetchError) throw fetchError;

      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setIsLoadingApps(false);
    }
  };

  const downloadResume = async (filePath: string, fileName: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading resume:', err);
      alert('Failed to download resume');
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // Refresh applications
      await fetchApplications();
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update application status');
    }
  };

  const exportApplicationsForOpportunity = (opportunityId: string) => {
    const filtered = applications.filter(app => app.opportunity_id === opportunityId);
    const opportunity = opportunities.find(o => o.id === opportunityId);
    
    if (filtered.length === 0) {
      alert('No applications for this opportunity');
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Email', 'Applied At', 'Status', 'Resume File', 'Resume Uploaded'].join(','),
      ...filtered.map(app => [
        app.email,
        new Date(app.applied_at).toLocaleString(),
        app.status,
        app.resume_file_name || 'No resume',
        app.resume_uploaded_at ? new Date(app.resume_uploaded_at).toLocaleString() : 'N/A'
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${opportunity?.title.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show loading state
  if (isLoading || isLoadingApps) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (!session || !isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 p-8 rounded-lg text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
            <p className="text-red-700">You must be an admin to view this page.</p>
            <Link href="/" className="mt-4 inline-block text-blue-primary hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredApplications = selectedOpportunity === 'all'
    ? applications
    : applications.filter(app => app.opportunity_id === selectedOpportunity);

  // Get application counts per opportunity
  const opportunityCounts = opportunities.map(opp => ({
    ...opp,
    count: applications.filter(app => app.opportunity_id === opp.id && app.status !== 'withdrawn').length
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-blue-primary mb-2">
                Applications Admin
              </h1>
              <p className="text-xl text-gray-600">
                View and manage applications for all opportunities
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Total Applications:</strong> {applications.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Active: {applications.filter(app => app.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Opportunity:
          </label>
          <select
            value={selectedOpportunity}
            onChange={(e) => setSelectedOpportunity(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-primary focus:border-blue-primary"
          >
            <option value="all">All Opportunities ({applications.length})</option>
            {opportunityCounts.map(opp => (
              <option key={opp.id} value={opp.id}>
                {opp.title} ({opp.count} applications)
              </option>
            ))}
          </select>

          {selectedOpportunity !== 'all' && (
            <button
              onClick={() => exportApplicationsForOpportunity(selectedOpportunity)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Applications (CSV)
            </button>
          )}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No applications found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const opportunity = opportunities.find(o => o.id === app.opportunity_id);
              
              return (
                <div key={app.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-blue-primary mb-1">
                            {opportunity?.title || app.opportunity_id}
                          </h3>
                          <p className="text-gray-700">{opportunity?.organization}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              <strong>Applicant:</strong> {app.email}
                            </span>
                            <span>
                              <strong>Applied:</strong> {new Date(app.applied_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                          app.status === 'contacted' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>

                      {app.resume_file_name && (
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                          <p className="font-medium text-gray-900 mb-1">Resume:</p>
                          <p className="text-gray-600">{app.resume_file_name}</p>
                          {app.resume_uploaded_at && (
                            <p className="text-gray-500 text-xs mt-1">
                              Uploaded: {new Date(app.resume_uploaded_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[180px]">
                      {app.resume_file_path && (
                        <button
                          onClick={() => downloadResume(app.resume_file_path!, app.resume_file_name!)}
                          className="px-4 py-2 bg-blue-primary text-white rounded-md hover:bg-blue-800 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Resume
                        </button>
                      )}
                      
                      <select
                        value={app.status}
                        onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-primary focus:border-blue-primary"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="contacted">Contacted</option>
                        <option value="rejected">Rejected</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/opportunities"
            className="px-4 py-2 text-blue-primary hover:text-blue-800 hover:underline"
          >
            ← Back to Opportunities
          </Link>
        </div>
      </div>
    </div>
  );
}

