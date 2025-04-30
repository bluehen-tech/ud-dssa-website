import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-primary sm:text-5xl md:text-6xl">
            UD Data Science Student Association
          </h1>
          <p className="mt-3 text-xl text-gray-600">
            Empowering the next generation of data scientists at the University of Delaware
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link 
              href="/about" 
              className="px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-gray-50 p-8 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-primary mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700">
            The UD Data Science Student Association aims to connect graduatestudents with industry partners, 
            showcase member skills, facilitate learning opportunities, and build a strong data science 
            community at the University of Delaware.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Member Portfolios</h3>
            <p className="text-gray-600">Showcase your skills and projects to potential employers and collaborators.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Events & Workshops</h3>
            <p className="text-gray-600">Participate in hands-on workshops, hackathons, and networking events.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-blue-primary mb-2">Services</h3>
            <p className="text-gray-600">Connect with organizations seeking data science expertise and solutions.</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-primary mb-4">Ready to join the data revolution?</h2>
          <p className="text-lg text-gray-600 mb-6">
            Whether you're just starting your data science journey or looking to expand your network,
            UDSSA has something for you.
          </p>
          <Link 
            href="/about" 
            className="px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
} 