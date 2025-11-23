"use client";
// @ts-nocheck - Supabase types not generated until database tables are created

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAuth } from '@/contexts/AuthContext';

interface OpportunityResume {
  id: string;
  user_id: string;
  opportunity_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface UseOpportunityResumesResult {
  resumesByOpportunity: Record<string, OpportunityResume>;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  uploadResume: (opportunityId: string, file: File) => Promise<boolean>;
  deleteResume: (opportunityId: string) => Promise<boolean>;
  downloadResume: (opportunityId: string) => Promise<void>;
  refreshResumes: () => Promise<void>;
  getResumeForOpportunity: (opportunityId: string) => OpportunityResume | null;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const sanitizeSegment = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'resume';
};

export function useOpportunityResumes(): UseOpportunityResumesResult {
  const { session } = useAuth();
  const [resumesByOpportunity, setResumesByOpportunity] = useState<Record<string, OpportunityResume>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    if (!session?.user?.id) {
      setResumesByOpportunity({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('opportunity_resumes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;

      const grouped: Record<string, OpportunityResume> = {};
      (data || []).forEach((resume) => {
        grouped[resume.opportunity_id] = resume;
      });

      setResumesByOpportunity(grouped);
    } catch (err) {
      console.error('Error fetching opportunity resumes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resumes');
      setResumesByOpportunity({});
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const uploadResume = useCallback(
    async (opportunityId: string, file: File): Promise<boolean> => {
      if (!session?.user?.id) {
        setError('You must be logged in to upload a resume');
        return false;
      }

      if (!opportunityId) {
        setError('Opportunity is required to upload a resume');
        return false;
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError('Invalid file type. Please upload a PDF or Word document.');
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('File is too large. Maximum size is 5MB.');
        return false;
      }

      try {
        setIsUploading(true);
        setError(null);

        const supabase = createClient();
        const userId = session.user.id;
        const username = session.user.email?.split('@')[0] || userId.slice(0, 8);
        const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '');
        const readableName = `${sanitizeSegment(username)}-${sanitizeSegment(opportunityId)}-${timestamp}.${extension}`;
        const filePath = `${opportunityId}/${userId}/${readableName}`;
        const existingResume = resumesByOpportunity[opportunityId];

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: upserted, error: dbError } = await supabase
          .from('opportunity_resumes')
          .upsert(
            {
              user_id: userId,
              opportunity_id: opportunityId,
              file_name: readableName,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type,
            },
            {
              onConflict: 'user_id,opportunity_id',
            }
          )
          .select()
          .single();

        if (dbError) {
          await supabase.storage.from('resumes').remove([filePath]);
          throw dbError;
        }

        if (existingResume && existingResume.file_path !== filePath) {
          await supabase.storage.from('resumes').remove([existingResume.file_path]);
        }

        setResumesByOpportunity((prev) => ({
          ...prev,
          [opportunityId]: upserted,
        }));

        return true;
      } catch (err) {
        console.error('Error uploading opportunity resume:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload resume');
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [session, resumesByOpportunity]
  );

  const deleteResume = useCallback(
    async (opportunityId: string): Promise<boolean> => {
      if (!session?.user?.id) {
        setError('You must be logged in to delete a resume');
        return false;
      }

      const resume = resumesByOpportunity[opportunityId];

      if (!resume) {
        setError('No resume found for this opportunity');
        return false;
      }

      try {
        setError(null);
        const supabase = createClient();

        await supabase.storage.from('resumes').remove([resume.file_path]);

        const { error: dbError } = await supabase
          .from('opportunity_resumes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('opportunity_id', opportunityId);

        if (dbError) throw dbError;

        setResumesByOpportunity((prev) => {
          const next = { ...prev };
          delete next[opportunityId];
          return next;
        });

        return true;
      } catch (err) {
        console.error('Error deleting opportunity resume:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete resume');
        return false;
      }
    },
    [session?.user?.id, resumesByOpportunity]
  );

  const downloadResume = useCallback(
    async (opportunityId: string) => {
      const resume = resumesByOpportunity[opportunityId];

      if (!resume) {
        setError('No resume available for download');
        return;
      }

      try {
        const supabase = createClient();

        const { data, error: downloadError } = await supabase.storage
          .from('resumes')
          .download(resume.file_path);

        if (downloadError) throw downloadError;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = resume.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error downloading opportunity resume:', err);
        setError(err instanceof Error ? err.message : 'Failed to download resume');
      }
    },
    [resumesByOpportunity]
  );

  const refreshResumes = useCallback(async () => {
    await fetchResumes();
  }, [fetchResumes]);

  const getResumeForOpportunity = useCallback(
    (opportunityId: string) => resumesByOpportunity[opportunityId] || null,
    [resumesByOpportunity]
  );

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  return {
    resumesByOpportunity,
    isLoading,
    isUploading,
    error,
    uploadResume,
    deleteResume,
    downloadResume,
    refreshResumes,
    getResumeForOpportunity,
  };
}


