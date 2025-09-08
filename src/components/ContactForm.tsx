'use client';

import { useState } from 'react';
import { ContactFormData, UDGradStudentForm, IndustryAcademicForm } from '@/types/contact';
import { dataScienceClubs } from '@/data/clubs';

export default function ContactForm() {
  const [formData, setFormData] = useState<Partial<ContactFormData>>({
    userType: 'ud-grad-student',
    email: '',
    selectedClubs: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.userType === 'ud-grad-student') {
      const studentData = formData as Partial<UDGradStudentForm>;
      
      if (!studentData.major) {
        newErrors.major = 'Major is required';
      }
      if (!studentData.graduationMonth) {
        newErrors.graduationMonth = 'Graduation month is required';
      }
      if (!studentData.graduationYear) {
        newErrors.graduationYear = 'Graduation year is required';
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
      // Simulate form submission (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Form submitted:', formData);
      
      setSubmitResult({
        success: true,
        message: 'Thank you for your interest! We\'ll be in touch soon.'
      });
      
      // Reset form
      setFormData({
        userType: 'ud-grad-student',
        email: '',
        selectedClubs: []
      });
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleClubToggle = (clubId: string) => {
    if (formData.userType !== 'ud-grad-student') return;
    
    const currentClubs = ((formData as UDGradStudentForm).selectedClubs || []);
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
        Get In Touch
      </h2>
      
      {submitResult && (
        <div className={`mb-6 p-4 rounded-md ${
          submitResult.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {submitResult.message}
        </div>
      )}

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
                value="industry-academic-friend"
                checked={formData.userType === 'industry-academic-friend'}
                onChange={(e) => handleInputChange('userType', e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">Industry or Academic Friend</span>
            </label>
          </div>
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
        {formData.userType === 'ud-grad-student' && (
          <>
            {/* Major */}
            <div>
              <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">
                Major *
              </label>
              <input
                type="text"
                id="major"
                value={(formData as Partial<UDGradStudentForm>).major || ''}
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
                  <label key={club.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={(formData.selectedClubs || []).includes(club.id)}
                      onChange={() => handleClubToggle(club.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{club.name}</div>
                      <div className="text-sm text-gray-600">{club.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Graduation Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="graduationMonth" className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Month *
                </label>
                <select
                  id="graduationMonth"
                  value={(formData as Partial<UDGradStudentForm>).graduationMonth || ''}
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
                  value={(formData as Partial<UDGradStudentForm>).graduationYear || ''}
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
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-primary text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
