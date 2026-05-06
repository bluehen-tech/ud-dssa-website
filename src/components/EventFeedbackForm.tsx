'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Event } from '@/types/event';

const LIKERT_LABELS = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree',
];

interface EventFeedbackFormProps {
  event: Event;
}

function StarIcon({ filled, hovered }: { filled: boolean; hovered: boolean }) {
  return (
    <svg
      className={`w-8 h-8 md:w-10 md:h-10 transition-all duration-150 ${
        filled
          ? 'text-yellow-400 drop-shadow-sm'
          : hovered
          ? 'text-yellow-300'
          : 'text-gray-300'
      }`}
      fill={filled || hovered ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

export default function EventFeedbackForm({ event }: EventFeedbackFormProps) {
  const [userType, setUserType] = useState('ud-grad-student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const feedbackUrl = `https://bluehen-dssa.org/feedback/${event.slug}`;

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#00539F', '#FFD200', '#1E88E5', '#43A047'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#00539F', '#FFD200', '#1E88E5', '#43A047'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  useEffect(() => {
    if (showCelebration) {
      fireConfetti();
    }
  }, [showCelebration, fireConfetti]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!rating) {
      newErrors.rating = 'Please select a rating';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: event.slug,
          userType,
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          rating,
          comments: comments.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      setShowCelebration(true);
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConnectedUrl = () => {
    const params = new URLSearchParams();
    params.set('userType', userType);
    if (fullName.trim()) params.set('fullName', fullName.trim());
    if (email.trim()) params.set('email', email.trim());
    return `/?${params.toString()}#contact-form`;
  };

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-blue-primary mb-3">
            Thank You!
          </h2>
          <p className="text-gray-700 mb-2 text-lg">
            Your voice matters! Feedback like yours helps UD-DSSA secure funding
            for future data science events.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            We truly appreciate you taking the time to share your thoughts.
          </p>

          <div className="space-y-4">
            <a
              href={getConnectedUrl()}
              className="block w-full py-3 px-6 bg-blue-primary text-white font-semibold rounded-lg hover:bg-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md"
            >
              {email.trim()
                ? 'Complete Your Profile & Join UD-DSSA'
                : 'Join Our Mailing List & Never Miss an Event'}
            </a>
            <p className="text-sm text-gray-500">
              {email.trim()
                ? 'Finish signing up to stay connected with UD\'s data science community.'
                : 'Subscribe to our email list and be the first to know about upcoming events!'}
            </p>
          </div>

          <button
            onClick={() => setShowCelebration(false)}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* QR Code Header */}
        <div className="bg-gradient-to-br from-blue-primary to-blue-800 p-6 text-center text-white">
          <div className="inline-block bg-white p-3 rounded-xl shadow-lg mb-4">
            <QRCodeSVG
              value={feedbackUrl}
              size={120}
              level="M"
              bgColor="#ffffff"
              fgColor="#00539F"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            {event.title}
          </h1>
          <p className="text-blue-100 text-sm">Event Feedback</p>
        </div>

        {/* Gratitude Banner */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <p className="text-blue-800 text-sm text-center leading-relaxed">
            Your feedback helps UD-DSSA demonstrate the value of data science
            events and secure future funding.{' '}
            <span className="font-semibold">Thank you!</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* User Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a: <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {[
                { value: 'ud-grad-student', label: 'UD Grad Student' },
                { value: 'undergraduate-student', label: 'UD Undergraduate Student' },
                { value: 'other-university-student', label: 'Student from Other University' },
                { value: 'industry-academic-friend', label: 'Industry or Academic Friend' },
              ].map((option) => (
                <label key={option.value} className="flex items-center group cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value={option.value}
                    checked={userType === option.value}
                    onChange={(e) => setUserType(e.target.value)}
                    className="mr-3 text-blue-primary focus:ring-blue-primary"
                  />
                  <span className="text-gray-700 group-hover:text-blue-primary transition-colors">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((p) => ({ ...p, fullName: '' }));
              }}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-primary transition-colors ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., John Smith"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Email (Optional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: '' }));
              }}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-primary transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your.email@udel.edu"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional &mdash; provide if you&apos;d like to stay connected
            </p>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Likert Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              &ldquo;I believe <span className="font-semibold text-blue-primary">{event.title}</span>{' '}
              makes a valuable contribution to the data science community at UD.&rdquo;{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 md:p-4 gap-1">
              <span className="text-[10px] md:text-xs text-gray-500 w-12 md:w-16 text-center leading-tight shrink-0">
                Strongly Disagree
              </span>
              <div className="flex gap-0.5 md:gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      if (errors.rating) setErrors((p) => ({ ...p, rating: '' }));
                    }}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-primary rounded-full p-0.5 transition-transform hover:scale-110"
                    aria-label={LIKERT_LABELS[star - 1]}
                    title={LIKERT_LABELS[star - 1]}
                  >
                    <StarIcon
                      filled={star <= rating}
                      hovered={star <= hoveredStar && star > rating}
                    />
                  </button>
                ))}
              </div>
              <span className="text-[10px] md:text-xs text-gray-500 w-12 md:w-16 text-center leading-tight shrink-0">
                Strongly Agree
              </span>
            </div>
            {rating > 0 && (
              <p className="mt-1 text-sm text-center text-gray-600 font-medium">
                {LIKERT_LABELS[rating - 1]}
              </p>
            )}
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600 text-center">{errors.rating}</p>
            )}
          </div>

          {/* Freeform Comments */}
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Share your thoughts on this event, or tell us what events you&apos;d
              like to see in the future.
            </label>
            <textarea
              id="comments"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-primary transition-colors resize-none"
              placeholder="Your feedback helps us plan better events..."
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 px-4 rounded-lg font-semibold text-lg transition-all duration-200 transform ${
              isSubmitting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-primary text-white hover:bg-blue-800 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
