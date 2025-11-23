"use client";
// @ts-nocheck - Supabase types not generated until database tables are created

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAuth } from '@/contexts/AuthContext';

interface ResumeUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface UseResumeUploadResult {
  resume: ResumeUpload | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  uploadResume: (file: File) => Promise<boolean>;
  deleteResume: () => Promise<boolean>;
  downloadResume: () => Promise<void>;
  refreshResume: () => Promise<void>;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function useResumeUpload(): UseResumeUploadResult {
  const { session } = useAuth();
  const [resume, setResume] = useState<ResumeUpload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's resume
  const fetchResume = useCallback(async () => {
    if (!session?.user?.id) {
      setResume(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('resume_uploads')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setResume(data);
    } catch (err) {
      console.error('Error fetching resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resume');
      setResume(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Upload resume
  const uploadResume = useCallback(async (file: File): Promise<boolean> => {
    if (!session?.user?.id) {
      setError('You must be logged in to upload a resume');
      return false;
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF or Word document.');
      return false;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 5MB.');
      return false;
    }

    try {
      setIsUploading(true);
      setError(null);

      const supabase = createClient();
      const userId = session.user.id;

      // Delete existing resume if present
      if (resume) {
        // Delete from storage
        await supabase.storage.from('resumes').remove([resume.file_path]);

        // Delete from database
        await supabase.from('resume_uploads').delete().eq('user_id', userId);
      }

      // Create file path: userId/filename
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${userId}/resume_${timestamp}.${fileExtension}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Insert record into database
      const { data: uploadData, error: dbError } = await supabase
        .from('resume_uploads')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) {
        // Rollback: delete the uploaded file
        await supabase.storage.from('resumes').remove([filePath]);
        throw dbError;
      }

      setResume(uploadData);
      return true;
    } catch (err) {
      console.error('Error uploading resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload resume');
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [session?.user?.id, resume]);

  // Delete resume
  const deleteResume = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id || !resume) {
      setError('No resume to delete');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resume.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('resume_uploads')
        .delete()
        .eq('user_id', session.user.id);

      if (dbError) throw dbError;

      setResume(null);
      return true;
    } catch (err) {
      console.error('Error deleting resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete resume');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, resume]);

  // Download resume
  const downloadResume = useCallback(async () => {
    if (!resume) {
      setError('No resume to download');
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: downloadError } = await supabase.storage
        .from('resumes')
        .download(resume.file_path);

      if (downloadError) throw downloadError;

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to download resume');
    }
  }, [resume]);

  // Refresh resume
  const refreshResume = useCallback(async () => {
    await fetchResume();
  }, [fetchResume]);

  // Fetch resume on mount and when session changes
  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  return {
    resume,
    isLoading,
    isUploading,
    error,
    uploadResume,
    deleteResume,
    downloadResume,
    refreshResume,
  };
}