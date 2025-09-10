'use client';

import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToForm = () => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const formElement = document.getElementById('contact-form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background animation */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="max-w-4xl w-full space-y-8 relative z-10">
        {/* Hero Section */}
        <div className={`text-center transition-all duration-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h1 className={`text-4xl font-bold text-blue-primary sm:text-5xl md:text-6xl transition-all duration-1200 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}>
            UD Data Science Student Association
          </h1>
          <p className={`mt-3 text-xl text-gray-600 transition-all duration-1000 delay-400 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Building the graduate student data science ecosystem at UD
          </p>
        </div>

        {/* Mission Section */}
        <div className={`bg-gray-50 p-6 rounded-lg transition-all duration-1000 delay-700 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl font-bold text-blue-primary mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700">
            The UD Data Science Student Association showcases graduate student talent, facilitates collaboration between data science clubs and events, and provides hands-on experience with industry tools through technology infrastructure development at UD and with industry partners.
          </p>
        </div>

        {/* Features Section */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 delay-900 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Member Portfolio Platform</h3>
            <p className="text-gray-600">Showcase your own projects and achievements while gaining hands-on experience with modern web and data science tools.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Interdisciplinary Event Marketing</h3>
            <p className="text-gray-600">Discover workshops, hackathons, and networking opportunities across all of UD and inclusive of all data science clubs.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Experiential Learning</h3>
            <p className="text-gray-600">Gain hands-on experience through industry partnerships and internal infrastructure projects including our new website, member portfolio platform, and email marketing infrastructure.</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className={`text-center mb-8 transition-all duration-1000 delay-1100 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-blue-primary">Ready to connect with UD's data science community?</h2>
            <button
              onClick={scrollToForm}
              className="px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 hover:scale-105 transition-all duration-200 whitespace-nowrap"
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
        <div id="contact-form" className={`transition-all duration-1000 delay-1300 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <ContactForm />
        </div>
      </div>
    </div>
  );
} 