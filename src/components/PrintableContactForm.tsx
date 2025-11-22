'use client';

import { useState } from 'react';

export default function PrintableContactForm() {
  const [formData, setFormData] = useState({
    userType: 'ud-grad-student',
    email: '',
    fullName: '',
    major: '',
    graduationDate: '',
    interestedInOfficer: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 rounded-lg shadow-lg print:shadow-none print:p-2">
      <h2 className="text-xl font-bold text-blue-primary mb-4 text-center print:text-lg">
        UD-DSSA Membership Form
      </h2>

      <div className="space-y-4 print:space-y-2">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 print:text-xs">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm print:text-xs focus:outline-none focus:ring-1 focus:ring-blue-primary"
            placeholder="your.email@udel.edu"
          />
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1 print:text-xs">
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm print:text-xs focus:outline-none focus:ring-1 focus:ring-blue-primary"
            placeholder="John Doe"
          />
        </div>

        {/* Major and Graduation Date - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
          <div>
            <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1 print:text-xs">
              Major *
            </label>
            <input
              type="text"
              id="major"
              value={formData.major}
              onChange={(e) => handleInputChange('major', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm print:text-xs focus:outline-none focus:ring-1 focus:ring-blue-primary"
              placeholder="e.g., Computer Science"
            />
          </div>
          <div>
            <label htmlFor="graduationDate" className="block text-sm font-medium text-gray-700 mb-1 print:text-xs">
              Expected Graduation Date *
            </label>
            <input
              type="text"
              id="graduationDate"
              value={formData.graduationDate}
              onChange={(e) => handleInputChange('graduationDate', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm print:text-xs focus:outline-none focus:ring-1 focus:ring-blue-primary"
              placeholder="e.g., May 2025"
            />
          </div>
        </div>

        {/* Officer Interest Checkbox */}
        <div>
          <label className="flex items-center print:text-xs">
            <input
              type="checkbox"
              checked={formData.interestedInOfficer}
              onChange={(e) => handleInputChange('interestedInOfficer', e.target.checked)}
              className="mr-2 print:mr-1"
            />
            <span className="text-gray-700 font-medium">Interested in becoming a UD-DSSA officer</span>
          </label>
        </div>
      </div>
    </div>
  );
}
