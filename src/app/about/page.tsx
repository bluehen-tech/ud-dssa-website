import Link from 'next/link';
import PrintableContactForm from '@/components/PrintableContactForm';

export default function AboutPage() {
  return (
    <div className="bg-white py-6 px-4 sm:px-6 lg:px-8 print:py-2 print:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section - Compressed */}
        <div className="text-center mb-6 print:mb-4">
          <h1 className="text-3xl font-bold text-blue-primary sm:text-4xl print:text-2xl">
            UD Data Science Student Association
          </h1>
          <p className="mt-2 text-lg text-gray-600 print:text-sm">
            Empowering the next generation of data scientists at the University of Delaware
          </p>
        </div>

        {/* Mission Section - Compressed */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 print:mb-4 print:p-2">
          <h2 className="text-xl font-bold text-blue-primary mb-2 print:text-lg">Our Mission</h2>
          <p className="text-sm text-gray-700 print:text-xs">
            The UD Data Science Student Association showcases our graduate talent, fosters cross-disciplinary learning, and builds a vibrant data science community through collaboration and industry partnerships at the University of Delaware.
          </p>
        </div>

        {/* Features Section - Compressed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:mb-4 print:grid-cols-3 print:gap-2">
          <div className="bg-white p-3 rounded-lg shadow-md print:p-2 print:shadow-sm">
            <h3 className="text-sm font-semibold text-blue-primary mb-1 print:text-xs">Member Portfolios</h3>
            <p className="text-xs text-gray-600 print:text-xs">Showcase your skills and projects to potential employers and collaborators.</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-md print:p-2 print:shadow-sm">
            <h3 className="text-sm font-semibold text-blue-primary mb-1 print:text-xs">Events & Workshops</h3>
            <p className="text-xs text-gray-600 print:text-xs">Participate in hands-on workshops, hackathons, and networking events.</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-md print:p-2 print:shadow-sm">
            <h3 className="text-sm font-semibold text-blue-primary mb-1 print:text-xs">Services</h3>
            <p className="text-xs text-gray-600 print:text-xs">Connect with organizations seeking data science expertise and solutions.</p>
          </div>
        </div>

        {/* Call to Action - Compressed */}
        <div className="text-center mb-6 print:mb-4">
          <h2 className="text-lg font-bold text-blue-primary mb-2 print:text-base">Ready to join the data revolution?</h2>
          <p className="text-sm text-gray-600 print:text-xs">
            Whether you're just starting your data science journey or looking to expand your network,
            UDSSA has something for you.
          </p>
        </div>

        {/* Printable Contact Form */}
        <PrintableContactForm />
      </div>
    </div>
  );
} 