"use client";
// @ts-nocheck - Supabase types not generated until database tables are created

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAuth } from '@/contexts/AuthContext';

interface Application {
  id: string;
  user_id: string;
  opportunity_id: string;
  resume_upload_id: string | null;
  applied_at: string;
  status: 'pending' | 'reviewed' | 'contacted' | 'rejected' | 'withdrawn';
  notes: string | null;
}

interface UseApplicationsResult {
  applications: Application[];
  isLoading: boolean;
  error: string | null;
  hasApplied: (opportunityId: string) => boolean;
  applyToOpportunity: (opportunityId: string, resumeUploadId: string | null) => Promise<boolean>;
  withdrawApplication: (opportunityId: string) => Promise<boolean>;
  refreshApplications: () => Promise<void>;
}

export function useApplications(): UseApplicationsResult {
  const { session } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's applications
  const fetchApplications = useCallback(async () => {
    if (!session?.user?.id) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('applied_at', { ascending: false });

      if (fetchError) throw fetchError;

      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Check if user has applied to a specific opportunity
  const hasApplied = useCallback((opportunityId: string): boolean => {
    return applications.some(
      app => app.opportunity_id === opportunityId && app.status !== 'withdrawn'
    );
  }, [applications]);

  // Apply to an opportunity
  const applyToOpportunity = useCallback(async (
    opportunityId: string,
    resumeUploadId: string | null
  ): Promise<boolean> => {
    if (!session?.user?.id) {
      setError('You must be logged in to apply');
      return false;
    }

    // Check if already applied
    if (hasApplied(opportunityId)) {
      setError('You have already applied to this opportunity');
      return false;
    }

    try {
      setError(null);

      const supabase = createClient();
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          user_id: session.user.id,
          opportunity_id: opportunityId,
          resume_upload_id: resumeUploadId,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Refresh applications list
      await fetchApplications();
      return true;
    } catch (err) {
      console.error('Error applying to opportunity:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply to opportunity');
      return false;
    }
  }, [session?.user?.id, hasApplied, fetchApplications]);

  // Withdraw application
  const withdrawApplication = useCallback(async (opportunityId: string): Promise<boolean> => {
    if (!session?.user?.id) {
      setError('You must be logged in');
      return false;
    }

    try {
      setError(null);

      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('user_id', session.user.id)
        .eq('opportunity_id', opportunityId);

      if (updateError) throw updateError;

      // Refresh applications list
      await fetchApplications();
      return true;
    } catch (err) {
      console.error('Error withdrawing application:', err);
      setError(err instanceof Error ? err.message : 'Failed to withdraw application');
      return false;
    }
  }, [session?.user?.id, fetchApplications]);

  // Refresh applications
  const refreshApplications = useCallback(async () => {
    await fetchApplications();
  }, [fetchApplications]);

  // Fetch applications on mount and when session changes
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    isLoading,
    error,
    hasApplied,
    applyToOpportunity,
    withdrawApplication,
    refreshApplications,
  };
}

