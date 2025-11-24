"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Opportunity, OpportunityType } from '@/types/opportunity';
import { useOpportunityResumes } from '@/hooks/useOpportunityResumes';
import { useApplications } from '@/hooks/useApplications';
import ResumeUploadModal from '@/components/ResumeUploadModal';
import { createClient } from '@/lib/supabase-browser';
import {
  recordToOpportunity,
  multilineFromArray,
  commaListFromArray,
  parseMultilineInput,
  parseCommaInput,
  toDatetimeLocalValue,
  sanitizeForFilename,
} from '@/utils/opportunityTransforms';

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf'];

interface OpportunityFormState {
  title: string;
  organization: string;
  type: OpportunityType;
  description: string;
  requirements: string;
  location: string;
  remote: boolean;
  applicationUrl: string;
  contactEmail: string;
  postedDate: string;
  deadline: string;
  tags: string;
}

const defaultFormState: OpportunityFormState = {
  title: '',
  organization: '',
  type: 'job',
  description: '',
  requirements: '',
  location: '',
  remote: false,
  applicationUrl: '',
  contactEmail: '',
  postedDate: '',
  deadline: '',
  tags: '',
};

export default function OpportunitiesPage() {
  const { session, isAdmin, isLoading } = useAuth();
  const supabase = createClient();

  // Opportunities state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [opportunityError, setOpportunityError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<OpportunityFormState>(defaultFormState);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [deletingOpportunityId, setDeletingOpportunityId] = useState<string | null>(null);

  // Existing resume/application hooks
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

  // Fetch opportunities from Supabase
  const fetchOpportunities = async () => {
    try {
      setLoadingOpportunities(true);
      setOpportunityError(null);
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      setOpportunities((data || []).map(recordToOpportunity));
    } catch (error: any) {
      console.error('Error fetching opportunities:', error);
      setOpportunityError(error.message || 'Failed to load opportunities');
    } finally {
      setLoadingOpportunities(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingOpportunity(null);
    setAttachmentFile(null);
    setRemoveExistingAttachment(false);
    setShowForm(false);
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        alert('Please upload a PDF file');
        return;
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        alert('File size must be less than 5MB');
        return;
      }
      setAttachmentFile(file);
      setRemoveExistingAttachment(false);
    }
  };

  // Handle edit
  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setFormState({
      title: opportunity.title,
      organization: opportunity.organization,
      type: opportunity.type,
      description: opportunity.description,
      requirements: multilineFromArray(opportunity.requirements),
      location: opportunity.location || '',
      remote: opportunity.remote || false,
      applicationUrl: opportunity.applicationUrl || '',
      contactEmail: opportunity.contactEmail || '',
      postedDate: toDatetimeLocalValue(opportunity.postedDate),
      deadline: toDatetimeLocalValue(opportunity.deadline),
      tags: commaListFromArray(opportunity.tags),
    });
    setAttachmentFile(null);
    setRemoveExistingAttachment(false);
    setShowForm(true);
  };

  // Handle submit (create or update)
  const handleOpportunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      alert('You must be logged in to manage opportunities');
      return;
    }

    try {
      setSavingOpportunity(true);

      let attachmentUrl = editingOpportunity?.attachmentUrl || null;
      let attachmentName = editingOpportunity?.attachmentName || null;
      let attachmentPath = editingOpportunity?.attachmentPath || null;

      // Handle attachment upload/removal
      if (removeExistingAttachment && editingOpportunity?.attachmentPath) {
        // Delete existing attachment
        const pathParts = editingOpportunity.attachmentPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const folderPath = pathParts.slice(0, -1).join('/');
        await supabase.storage.from('opportunities').remove([`${folderPath}/${fileName}`]);
        attachmentUrl = null;
        attachmentName = null;
        attachmentPath = null;
      }

      if (attachmentFile) {
        // Delete old attachment if editing
        if (editingOpportunity?.attachmentPath) {
          const pathParts = editingOpportunity.attachmentPath.split('/');
          const fileName = pathParts[pathParts.length - 1];
          const folderPath = pathParts.slice(0, -1).join('/');
          await supabase.storage.from('opportunities').remove([`${folderPath}/${fileName}`]);
        }

        // Upload new attachment
        const fileExt = 'pdf';
        const sanitizedTitle = sanitizeForFilename(formState.title);
        const fileName = `${Date.now()}-${sanitizedTitle}.${fileExt}`;
        const filePath = `opportunity-attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('opportunities')
          .upload(filePath, attachmentFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('opportunities').getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
        attachmentName = attachmentFile.name;
        attachmentPath = filePath;
      }

      // Prepare data
      const requirementsArray = parseMultilineInput(formState.requirements);
      const tagsArray = parseCommaInput(formState.tags);

      const opportunityData: any = {
        title: formState.title,
        organization: formState.organization,
        type: formState.type,
        description: formState.description,
        requirements: requirementsArray.length > 0 ? requirementsArray : null,
        location: formState.location || null,
        remote: formState.remote,
        application_url: formState.applicationUrl || null,
        contact_email: formState.contactEmail || null,
        posted_at: formState.postedDate ? new Date(formState.postedDate).toISOString() : new Date().toISOString(),
        deadline: formState.deadline ? new Date(formState.deadline).toISOString() : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_path: attachmentPath,
        created_by: session.user.id,
      };

      if (editingOpportunity) {
        // Update existing
        const { error: updateError } = await (supabase
          .from('opportunities') as any)
          .update(opportunityData)
          .eq('id', editingOpportunity.id);

        if (updateError) throw updateError;
        alert('Opportunity updated successfully!');
      } else {
        // Create new
        const { error: insertError } = await supabase.from('opportunities').insert(opportunityData);
        if (insertError) throw insertError;
        alert('Opportunity added successfully!');
      }

      resetForm();
      await fetchOpportunities();
    } catch (error: any) {
      console.error('Error saving opportunity:', error);
      alert(`Error saving opportunity: ${error.message}`);
    } finally {
      setSavingOpportunity(false);
    }
  };

  // Handle delete
  const handleDeleteOpportunity = async (opportunityId: string, attachmentPath?: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }

    try {
      setDeletingOpportunityId(opportunityId);

      // Delete attachment if exists
      if (attachmentPath) {
        const pathParts = attachmentPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const folderPath = pathParts.slice(0, -1).join('/');
        await supabase.storage.from('opportunities').remove([`${folderPath}/${fileName}`]);
      }

      // Delete opportunity
      const { error } = await supabase.from('opportunities').delete().eq('id', opportunityId);
      if (error) throw error;

      await fetchOpportunities();
      alert('Opportunity deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting opportunity:', error);
      alert(`Error deleting opportunity: ${error.message}`);
    } finally {
      setDeletingOpportunityId(null);
    }
  };

  // Utility functions
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusColor = (status: string | null): string => {
    if (!status) return '';
    const colors: Record<string, string> = {
      pending: 'bg-green-50 border-green-500 text-green-700',
      'not-applied': 'bg-gray-50 border-gray-400 text-gray-600',
      reviewed: 'bg-blue-50 border-blue-500 text-blue-700',
      contacted: 'bg-purple-50 border-purple-500 text-purple-700',
      rejected: 'bg-red-50 border-red-500 text-red-700',
      withdrawn: 'bg-gray-50 border-gray-500 text-gray-700',
    };
    return colors[status] || 'bg-gray-50 border-gray-500 text-gray-700';
  };

  const getStatusLabel = (status: string | null): string => {
    if (!status) return '';
    const labels: Record<string, string> = {
      pending: 'Applied',
      'not-applied': 'Not Applied',
      reviewed: 'Under Review',
      contacted: 'Contacted',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    };
    return labels[status] || status;
  };

  // Resume/Application handlers
  const handleUploadResume = async (file: File): Promise<boolean> => {
    if (!resumeModalOpportunityId) return false;
    const success = await uploadResume(resumeModalOpportunityId, file);
    if (success) {
      // Automatically submit application after successful resume upload
      const opportunityResume = getResumeForOpportunity(resumeModalOpportunityId);
      if (opportunityResume) {
        // Check if already applied to avoid duplicate
        if (!hasApplied(resumeModalOpportunityId)) {
          await applyToOpportunity(resumeModalOpportunityId, opportunityResume.id);
        }
      }
      setResumeModalOpportunityId(null);
      return true;
    }
    return false;
  };

  const handleDeleteResume = async () => {
    if (!deleteConfirmId) return;
    const success = await deleteResume(deleteConfirmId);
    if (success) {
      // If user had applied, withdraw the application when resume is deleted
      if (hasApplied(deleteConfirmId)) {
        await withdrawApplication(deleteConfirmId);
      }
      setDeleteConfirmId(null);
    }
  };


  const handleWithdraw = async () => {
    if (!withdrawConfirmId) return;
    
    // First withdraw the application
    const withdrawSuccess = await withdrawApplication(withdrawConfirmId);
    
    // Then delete the resume to fully reset to "Not Applied" status
    if (withdrawSuccess) {
      const deleteSuccess = await deleteResume(withdrawConfirmId);
      if (deleteSuccess) {
        setWithdrawConfirmId(null);
      }
    } else {
      setWithdrawConfirmId(null);
    }
  };

  // Determine which opportunities to display (always from Supabase)
  const displayOpportunities = useMemo(() => {
    return opportunities;
  }, [opportunities]);

  // Show loading state
  if (isLoading || loadingOpportunities) {
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
              <h1 className="text-4xl font-bold text-blue-primary mb-2">Opportunities</h1>
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
              <h2 className="text-2xl font-bold text-blue-primary">Sign In to Access Full Details</h2>
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
          {displayOpportunities.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <p className="text-gray-600 mb-4">No opportunities available at this time. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="block bg-white p-6 rounded-lg shadow-md border-2 border-gray-200 relative overflow-hidden hover:border-blue-primary hover:shadow-xl transition-all duration-300"
                >
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
                          <h2 className="text-2xl font-bold text-blue-primary mb-1">{opportunity.title}</h2>
                          <p className="text-lg text-gray-700 font-medium">{opportunity.organization}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(opportunity.type)}`}>
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

                      <div className="relative">
                        <p className="text-gray-700 blur-sm select-none">{opportunity.description}</p>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-white px-4 py-2 rounded-md shadow-md text-sm font-medium text-gray-700">
                            Sign in to view details
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[200px]">
                      <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 font-medium rounded-md cursor-not-allowed opacity-60">
                        Sign In to Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link href="/" className="px-4 py-2 text-blue-primary hover:text-blue-800 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userEmail = session.user.email;
  const canManageOpportunities = Boolean(session && isAdmin);
  const opportunityForUpload = resumeModalOpportunityId
    ? displayOpportunities.find((opp) => opp.id === resumeModalOpportunityId)
    : null;
  const opportunityPendingDeletion = deleteConfirmId
    ? displayOpportunities.find((opp) => opp.id === deleteConfirmId)
    : null;
  const resumePendingDeletion = deleteConfirmId ? resumesByOpportunity[deleteConfirmId] : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-blue-primary mb-2">Opportunities</h1>
              <p className="text-xl text-gray-600">
                Career, internship, and project opportunities curated for DSSA members.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Signed in as:</strong> {userEmail}
              </p>
              <p className="text-xs text-gray-400 mt-1">{isAdmin ? 'Admin' : 'Member'}</p>
            </div>
          </div>

          {/* Admin: Add Opportunity Button */}
          {canManageOpportunities && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(!showForm);
                }}
                className="px-4 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
              >
                {showForm ? 'Cancel' : '+ Add New Opportunity'}
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {opportunityError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{opportunityError}</p>
          </div>
        )}

        {/* Admin: Add/Edit Opportunity Form */}
        {canManageOpportunities && showForm && (
          <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-blue-primary mb-4">
              {editingOpportunity ? 'Edit Opportunity' : 'Add New Opportunity'}
            </h2>
            <form onSubmit={handleOpportunitySubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                    placeholder="e.g., Data Science Intern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.organization}
                    onChange={(e) => setFormState({ ...formState, organization: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                    placeholder="e.g., Tech Company Inc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formState.type}
                  onChange={(e) => setFormState({ ...formState, type: e.target.value as OpportunityType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                >
                  <option value="job">Job</option>
                  <option value="internship">Internship</option>
                  <option value="project">Project</option>
                  <option value="research">Research</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                  placeholder="Describe the opportunity..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements (one per line)
                </label>
                <textarea
                  value={formState.requirements}
                  onChange={(e) => setFormState({ ...formState, requirements: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                  placeholder="Currently enrolled in data science program&#10;Experience with Python&#10;Strong analytical skills"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                    placeholder="e.g., Newark, DE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remote Available
                  </label>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={formState.remote}
                      onChange={(e) => setFormState({ ...formState, remote: e.target.checked })}
                      className="w-4 h-4 text-blue-primary border-gray-300 rounded focus:ring-blue-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700">Yes</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application URL
                  </label>
                  <input
                    type="url"
                    value={formState.applicationUrl}
                    onChange={(e) => setFormState({ ...formState, applicationUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                    placeholder="https://example.com/apply"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formState.contactEmail}
                    onChange={(e) => setFormState({ ...formState, contactEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posted Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formState.postedDate}
                    onChange={(e) => setFormState({ ...formState, postedDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={formState.deadline}
                    onChange={(e) => setFormState({ ...formState, deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formState.tags}
                  onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                  placeholder="Python, Machine Learning, SQL, Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachment (PDF, Optional)
                </label>
                {editingOpportunity?.attachmentUrl && !removeExistingAttachment && (
                  <div className="mb-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      Current: <a href={editingOpportunity.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-primary hover:underline">{editingOpportunity.attachmentName}</a>
                    </p>
                    <button
                      type="button"
                      onClick={() => setRemoveExistingAttachment(true)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove attachment
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
                />
                {attachmentFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {attachmentFile.name} ({formatFileSize(attachmentFile.size)})
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">PDF files only, max 5MB</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={savingOpportunity}
                  className="px-6 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingOpportunity ? 'Saving...' : editingOpportunity ? 'Update Opportunity' : 'Add Opportunity'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resume Error */}
        {resumeError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{resumeError}</p>
          </div>
        )}

        {/* Opportunities List */}
        {displayOpportunities.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <p className="text-gray-600 mb-4">No opportunities available at this time. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayOpportunities.map((opportunity) => {
              const applied = hasApplied(opportunity.id);
              const application = applications.find(app => app.opportunity_id === opportunity.id && app.status !== 'withdrawn');
              const opportunityResume = resumesByOpportunity[opportunity.id];
              // Determine status: show actual application status, or "Applied" if resume uploaded, or "Not Applied" if neither
              const applicationStatus = application?.status || (opportunityResume ? 'pending' : 'not-applied');
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
                          <h2 className="text-2xl font-bold text-blue-primary mb-1">{opportunity.title}</h2>
                          <p className="text-lg text-gray-700 font-medium">{opportunity.organization}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(opportunity.type)}`}>
                          {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                        </span>
                        {canManageOpportunities && (
                          <div className="flex gap-2 ml-auto">
                            <button
                              onClick={() => handleEditOpportunity(opportunity)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteOpportunity(opportunity.id, opportunity.attachmentPath)}
                              disabled={deletingOpportunityId === opportunity.id}
                              className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              {deletingOpportunityId === opportunity.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4">{opportunity.description}</p>

                      {opportunity.requirements && opportunity.requirements.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2">Requirements:</h3>
                          <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {opportunity.requirements.map((req, idx) => (
                              <li key={idx} className="text-sm">
                                {req}
                              </li>
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
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {opportunity.attachmentUrl && (
                        <div className="mb-4">
                          <a
                            href={opportunity.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            View Attachment (PDF)
                          </a>
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
                              <p className="text-sm text-gray-700">No resume attached yet. Upload a resume to apply to this opportunity.</p>
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
                              Upload Resume & Apply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[200px]">
                      <div className={`px-4 py-2 border-2 font-medium rounded-md text-center flex items-center justify-center gap-2 ${getStatusColor(applicationStatus)}`}>
                        {applicationStatus === 'pending' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {applicationStatus === 'not-applied' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                          </svg>
                        )}
                        {applicationStatus === 'reviewed' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {applicationStatus === 'contacted' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                        {applicationStatus === 'rejected' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {applicationStatus === 'withdrawn' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {getStatusLabel(applicationStatus)}
                      </div>
                      {applicationStatus && applicationStatus !== 'withdrawn' && applicationStatus !== 'rejected' && applicationStatus !== 'not-applied' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWithdrawConfirmId(opportunity.id);
                          }}
                          className="px-4 py-2 bg-white border border-red-500 text-red-500 font-medium rounded-md hover:bg-red-50 transition-colors text-sm"
                        >
                          Withdraw Application
                        </button>
                      )}
                      {applicationStatus === 'not-applied' && (
                        <p className="text-sm text-gray-600 text-center">
                          Upload a resume to apply to this opportunity.
                        </p>
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
          <Link href="/" className="px-4 py-2 text-blue-primary hover:text-blue-800 hover:underline">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Withdraw Application?</h3>
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
