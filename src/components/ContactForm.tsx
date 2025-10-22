'use client';

import { useState } from 'react';
import { ContactFormData, UDGradStudentForm, IndustryAcademicForm, UndergraduateStudentForm, OtherUniversityStudentForm } from '@/types/contact';
import { dataScienceClubs } from '@/data/clubs';

export default function ContactForm() {
  const [formData, setFormData] = useState<Partial<ContactFormData>>({
    userType: 'ud-grad-student',
    email: '',
    fullName: '',
    selectedClubs: ['1'], // Auto-select UDSSA by default
    interestedInOfficer: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full name validation
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.userType === 'ud-grad-student' || formData.userType === 'undergraduate-student' || formData.userType === 'other-university-student') {
      const studentData = formData as Partial<UDGradStudentForm | UndergraduateStudentForm | OtherUniversityStudentForm>;
      
      if (!studentData.major) {
        newErrors.major = 'Major is required';
      }
      if (!studentData.graduationMonth) {
        newErrors.graduationMonth = 'Graduation month is required';
      }
      if (!studentData.graduationYear) {
        newErrors.graduationYear = 'Graduation year is required';
      }
      
      // Additional validation for other university students
      if (formData.userType === 'other-university-student') {
        const otherUniData = formData as Partial<OtherUniversityStudentForm>;
        if (!otherUniData.affiliation) {
          newErrors.affiliation = 'University affiliation is required';
        }
      }
    } else if (formData.userType === 'industry-academic-friend') {
      const industryData = formData as Partial<IndustryAcademicForm>;
      
      if (!industryData.affiliation) {
        newErrors.affiliation = 'Company/University affiliation is required';
      }
      if (!industryData.jobTitle) {
        newErrors.jobTitle = 'Job title is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Submit form to API
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Submission failed');
      }
      
      setSubmitResult({
        success: true,
        message: `Welcome to the UDSSA community, ${formData.fullName}! Your email, ${formData.email}, has been registered to our mailing list and we look forward to interacting with you in the future.`
      });
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          userType: 'ud-grad-student',
          email: '',
          fullName: '',
          selectedClubs: ['1'], // Auto-select UDSSA on reset
          interestedInOfficer: false
        });
        setSubmitResult(null);
      }, 15000); // Show confirmation for 15 seconds
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-select UDSSA when user type changes to any student type
      if (field === 'userType' && (value === 'ud-grad-student' || value === 'undergraduate-student' || value === 'other-university-student')) {
        const currentClubs = (newData as Partial<UDGradStudentForm | UndergraduateStudentForm | OtherUniversityStudentForm>).selectedClubs || [];
        if (!currentClubs.includes('1')) {
          (newData as Partial<UDGradStudentForm | UndergraduateStudentForm | OtherUniversityStudentForm>).selectedClubs = [...currentClubs, '1'];
        }
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleClubToggle = (clubId: string) => {
    if (formData.userType !== 'ud-grad-student' && formData.userType !== 'undergraduate-student' && formData.userType !== 'other-university-student') return;
    
    // Prevent unchecking UDSSA (id: '1') since they're already part of it
    if (clubId === '1') return;
    
    const currentClubs = ((formData as UDGradStudentForm | UndergraduateStudentForm | OtherUniversityStudentForm).selectedClubs || []);
    const newClubs = currentClubs.includes(clubId)
      ? currentClubs.filter(id => id !== clubId)
      : [...currentClubs, clubId];
    
    handleInputChange('selectedClubs', newClubs);
  };

  const graduationMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const graduationYears = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i);

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-blue-primary mb-6 text-center">
        Get Connected
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            I am a:
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="userType"
                value="ud-grad-student"
                checked={formData.userType === 'ud-grad-student'}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">UD Grad Student</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="userType"
                value="undergraduate-student"
                checked={formData.userType === 'undergraduate-student'}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">UD Undergraduate Student</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="userType"
                value="other-university-student"
                checked={formData.userType === 'other-university-student'}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">Student from Other University</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="userType"
                value="industry-academic-friend"
                checked={formData.userType === 'industry-academic-friend'}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">Industry or Academic Friend</span>
            </label>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName || ''}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., John Smith"
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your.email@udel.edu"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Conditional Fields */}
        {(formData.userType === 'ud-grad-student' || formData.userType === 'undergraduate-student' || formData.userType === 'other-university-student') && (
          <>
            {/* Affiliation - Only for Other University Students */}
            {formData.userType === 'other-university-student' && (
              <div>
                <label htmlFor="affiliation" className="block text-sm font-medium text-gray-700 mb-1">
                  University Affiliation *
                </label>
                <input
                  type="text"
                  id="affiliation"
                  value={(formData as Partial<OtherUniversityStudentForm>).affiliation || ''}
                  onChange={(e) => handleInputChange('affiliation', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary ${
                    errors.affiliation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., University of Pennsylvania, MIT, Stanford University"
                />
                {errors.affiliation && <p className="mt-1 text-sm text-red-600">{errors.affiliation}</p>}
              </div>
            )}

            {/* Major */}
            <div>
              <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">
                Major *
              </label>
              <input
                type="text"
                id="major"
                value={(formData as Partial<UDGradStudentForm | UndergraduateStudentForm | OtherUniversityStudentForm>).major || ''}
                onChange={(e) => handleInputChange('major', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary ${
                  errors.major ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Computer Science, Data Science, Statistics"
              />
              {errors.major && <p className="mt-1 text-sm text-red-600">{errors.major}</p>}
            </div>

            {/* Club Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Which UD Data Science clubs interest you? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dataScienceClubs.map((club) => (
                  <label key={club.id} className={`flex items-start space-x-3 p-3 border rounded-md ${
                    club.id === '1' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={(formData.selectedClubs || []).includes(club.id)}
                      onChange={() => handleClubToggle(club.id)}
                      disabled={club.id === '1'}
                      className={`mt-1 ${club.id === '1' ? 'cursor-not-allowed' : ''}`}
                    />
                    <div>
                      <div className={`font-medium ${club.id === '1' ? 'text-blue-900' : 'text-gray-900'}`}>
                        {club.name}
                        {club.id === '1' && <span className="text-xs text-blue-600 ml-2">(Auto-selected)</span>}
                      </div>
                      <div className="text-sm text-gray-600">{club.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Leadership Interest - Only for UD Grad Students */}
            {formData.userType === 'ud-grad-student' && (
              <div>
                <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-md hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={(formData as Partial<UDGradStudentForm>).interestedInOfficer || false}
                    onChange={(e) => handleInputChange('interestedInOfficer', e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      Interested in UDSSA Leadership Position
                    </div>
                    <div className="text-sm text-gray-600">
                      Help lead the organization and shape the future of UD's data science community
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Graduation Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="graduationMonth" className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Month *
                </label>
                <select
                  id="graduationMonth"
                  value={(formData as Partial<UDGradStudentForm | UndergraduateStudentForm | OtherUniversityStudentForm>).graduationMonth || ''}
                  onChange={(e) => handleInputChange('graduationMonth', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary ${
                    errors.graduationMonth ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select month</option>
                  {graduationMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                {errors.graduationMonth && <p className="mt-1 text-sm text-red-600">{errors.graduationMonth}</p>}
              </div>
              
              <div>
                <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year *
                </label>
                <select
                  id="graduationYear"
                  value={(formData as Partial<UDGradStudentForm | UndergraduateStudentForm | OtherUniversityStudentForm>).graduationYear || ''}
                  onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary ${
                    errors.graduationYear ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select year</option>
                  {graduationYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.graduationYear && <p className="mt-1 text-sm text-red-600">{errors.graduationYear}</p>}
              </div>
            </div>
          </>
        )}

        {formData.userType === 'industry-academic-friend' && (
          <>
            {/* Affiliation */}
            <div>
              <label htmlFor="affiliation" className="block text-sm font-medium text-gray-700 mb-1">
                Company/University Affiliation *
              </label>
              <input
                type="text"
                id="affiliation"
                value={(formData as Partial<IndustryAcademicForm>).affiliation || ''}
                onChange={(e) => handleInputChange('affiliation', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary ${
                  errors.affiliation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Google, University of Pennsylvania, JP Morgan"
              />
              {errors.affiliation && <p className="mt-1 text-sm text-red-600">{errors.affiliation}</p>}
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                id="jobTitle"
                value={(formData as Partial<IndustryAcademicForm>).jobTitle || ''}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary ${
                  errors.jobTitle ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Data Scientist, Professor, Research Director"
              />
              {errors.jobTitle && <p className="mt-1 text-sm text-red-600">{errors.jobTitle}</p>}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={(formData as Partial<IndustryAcademicForm>).notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary"
                placeholder="Tell us how you'd like to get involved with UDSSA..."
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-md font-medium transition-all duration-200 transform ${
              isSubmitting
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-primary text-white hover:bg-blue-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              '🌱 Join the Community 🌱'
            )}
          </button>
        </div>

        {/* Success/Error Message - positioned right after submit button */}
        {submitResult && (
          <div className={`mt-4 p-4 rounded-lg border transition-all duration-300 ${
            submitResult.success 
              ? 'bg-green-50 text-green-800 border-green-200 shadow-sm' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {submitResult.success ? (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-800 mb-1">Welcome to the community!</h3>
                  <p className="text-sm text-green-700 leading-relaxed">{submitResult.message}</p>
                  <div className="mt-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded inline-block">
                    ✨ You're now part of the UD data science ecosystem
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-1">Submission Error</h3>
                  <p className="text-sm text-red-700">{submitResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
