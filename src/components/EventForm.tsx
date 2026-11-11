"use client";

import { useState } from 'react';

export interface EventFormValues {
  title: string;
  slug: string;
  description: string;
  event_date: string; // datetime-local value, in the browser's time zone
  event_url: string;
}

export interface FlyerChange {
  file: File | null; // new PDF to upload (replaces any current flyer)
  remove: boolean; // remove the current flyer without replacing it
}

interface EventFormProps {
  heading: string;
  submitLabel: string;
  busyLabel: string;
  initialValues: EventFormValues;
  /** Set when editing: the event's current flyer and slug. */
  existingFlyerUrl?: string | null;
  originalSlug?: string;
  /** Resolve true on success; the parent reports errors. */
  onSubmit: (values: EventFormValues, flyer: FlyerChange) => Promise<boolean>;
  onCancel: () => void;
}

export const EMPTY_EVENT_FORM: EventFormValues = {
  title: '',
  slug: '',
  description: '',
  event_date: '',
  event_url: '',
};

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')
    .replace(/^-+/, '');
}

/** ISO timestamp -> value for <input type="datetime-local"> in the browser's time zone. */
export function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({
  heading,
  submitLabel,
  busyLabel,
  initialValues,
  existingFlyerUrl,
  originalSlug,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const isEdit = originalSlug !== undefined;
  const [formData, setFormData] = useState<EventFormValues>(initialValues);
  // When editing, never rewrite the slug from the title: that would silently
  // break feedback links that were already shared.
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFlyer, setRemoveFlyer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const slugChanged = isEdit && Boolean(originalSlug) && formData.slug !== originalSlug;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        e.target.value = '';
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setRemoveFlyer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData, { file: selectedFile, remove: removeFlyer });
    } finally {
      setSubmitting(false);
    }
  };

  const idPrefix = isEdit ? `edit-${originalSlug || 'event'}` : 'add-event';

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-primary mb-4">{heading}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={`${idPrefix}-title`} className="block text-sm font-medium text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            id={`${idPrefix}-title`}
            type="text"
            required
            value={formData.title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setFormData({
                ...formData,
                title: newTitle,
                ...(slugManuallyEdited ? {} : { slug: generateSlug(newTitle) }),
              });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
            placeholder="e.g., DSSA Fall Kickoff Event"
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-slug`} className="block text-sm font-medium text-gray-700 mb-2">
            Feedback URL Slug
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 shrink-0">/feedback/</span>
            <input
              id={`${idPrefix}-slug`}
              type="text"
              value={formData.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setFormData({ ...formData, slug: generateSlug(e.target.value) });
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent font-mono text-sm"
              placeholder="auto-generated-from-title"
            />
          </div>
          {slugChanged ? (
            <p className="text-xs text-amber-700 mt-1" role="note">
              Changing the slug breaks feedback links already shared for /feedback/{originalSlug}. Feedback already
              submitted is kept.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              {isEdit
                ? 'Used in the feedback form URL. Changing it breaks links already shared.'
                : 'Auto-generated from title. Edit to customize the feedback URL.'}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${idPrefix}-description`} className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id={`${idPrefix}-description`}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
            placeholder="Describe the event..."
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-date`} className="block text-sm font-medium text-gray-700 mb-2">
            Event Date &amp; Time *
          </label>
          <input
            id={`${idPrefix}-date`}
            type="datetime-local"
            required
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-url`} className="block text-sm font-medium text-gray-700 mb-2">
            Event URL (Optional)
          </label>
          <input
            id={`${idPrefix}-url`}
            type="url"
            value={formData.event_url}
            onChange={(e) => setFormData({ ...formData, event_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
            placeholder="https://example.com/event-registration"
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-flyer`} className="block text-sm font-medium text-gray-700 mb-2">
            {existingFlyerUrl ? 'Replace Flyer (PDF, Optional)' : 'Event Flyer (PDF, Optional)'}
          </label>
          {existingFlyerUrl && (
            <div className="flex flex-wrap items-center gap-4 mb-2 text-sm">
              <a
                href={existingFlyerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-blue-primary underline ${removeFlyer || selectedFile ? 'line-through opacity-60' : ''}`}
              >
                Current flyer
              </a>
              <label className="inline-flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={removeFlyer}
                  disabled={Boolean(selectedFile)}
                  onChange={(e) => setRemoveFlyer(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Remove current flyer
              </label>
            </div>
          )}
          <input
            id={`${idPrefix}-flyer`}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-primary focus:border-transparent"
          />
          {selectedFile && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              {existingFlyerUrl ? ' (replaces the current flyer)' : ''}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">PDF files only, max 5MB</p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? busyLabel : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
