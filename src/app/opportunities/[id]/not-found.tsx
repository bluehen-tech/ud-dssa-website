import Link from 'next/link';

export default function OpportunityNotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-4xl font-bold text-blue-primary mb-4">
            Opportunity Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The opportunity you're looking for doesn't exist or may have been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/opportunities"
              className="inline-block px-6 py-3 bg-blue-primary text-white font-medium rounded-md hover:bg-blue-800 transition-colors duration-200"
            >
              View All Opportunities
            </Link>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

