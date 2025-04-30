import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-primary sm:text-4xl">
            About the UD Data Science Student Association
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Empowering students through data science education, community, and real-world projects.
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-blue-primary mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700 mb-6">
            The University of Delaware Data Science Student Association (UDSSA) is dedicated to fostering a vibrant 
            community of data science enthusiasts. We aim to bridge the gap between academic learning and industry 
            application by providing hands-on experiences, networking opportunities, and resources for students 
            interested in data science and related fields.
          </p>
          
          <h2 className="text-2xl font-bold text-blue-primary mb-4 mt-8">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-primary mb-2">Workshops & Training</h3>
              <p className="text-gray-700">
                We organize regular workshops, coding sessions, and training programs on various data science 
                topics, tools, and technologies.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-primary mb-2">Industry Connections</h3>
              <p className="text-gray-700">
                We facilitate networking events with industry professionals, alumni, and potential employers 
                to create career opportunities.
              </p>
            </div>
          </div>

          {/* Contact Information Section */}
          <h2 className="text-2xl font-bold text-blue-primary mb-4 mt-12">Contact Us</h2>
          <p className="text-lg text-gray-700 mb-6">
            We'd love to hear from you! Whether you're interested in joining our organization, partnering with us, 
            or just have questions about data science at UD, please feel free to reach out.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-primary mb-4">Get in Touch</h3>
            <div className="space-y-3">
              <p className="text-gray-700">
                <span className="font-medium">Email:</span> dsi-info@udel.edu
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Location:</span> University of Delaware, Newark, DE
              </p>
            </div>
            
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-blue-primary mb-2">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-700 hover:text-blue-primary">Twitter</a>
                <a href="#" className="text-gray-700 hover:text-blue-primary">LinkedIn</a>
                <a href="#" className="text-gray-700 hover:text-blue-primary">Instagram</a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-primary hover:bg-blue-800"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 