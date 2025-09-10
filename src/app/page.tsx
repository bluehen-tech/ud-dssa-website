'use client';

import Link from 'next/link';
import ContactForm from '@/components/ContactForm';

export default function Home() {
  const scrollToForm = () => {
    const formElement = document.getElementById('contact-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-primary sm:text-5xl md:text-6xl">
            UD Data Science Student Association
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Building the graduate student data science ecosystem at UD
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-primary mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700">
            The UD Data Science Student Association showcases graduate student talent, facilitates collaboration between data science clubs and events, and provides hands-on experience with industry tools through technology infrastructure development at UD and with industry partners.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Member Portfolio Platform</h3>
            <p className="text-gray-600">Showcase your own projects and achievements while gaining hands-on experience with modern web and data science tools.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Interdisciplinary Event Marketing</h3>
            <p className="text-gray-600">Discover workshops, hackathons, and networking opportunities across all of UD and inclusive of all data science clubs.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Experiential Learning</h3>
            <p className="text-gray-600">Gain hands-on experience through industry partnerships and internal infrastructure projects including our new website, member portfolio platform, and email marketing infrastructure.</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-blue-primary">Ready to connect with UD's data science community?</h2>
            <button
              onClick={scrollToForm}
              className="px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap"
            >
              Get Connected
            </button>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Whether you're a graduate student showcasing your projects, discovering events, and building infrastructure, or an industry professional looking to collaborate with and develop UD's graduate talent,
            UDSSA has something for you.
          </p>
        </div>

        {/* Contact Form */}
        <div id="contact-form">
          <ContactForm />
        </div>
      </div>
    </div>
  );
} 