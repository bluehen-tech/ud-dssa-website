import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center -mx-5 -my-2">
          <div className="px-5 py-2">
            <Link href="/" className="text-base text-gray-600 hover:text-blue-primary">
              Home
            </Link>
          </div>
          <div className="px-5 py-2">
            <a href="https://dsi.udel.edu/" target="_blank" rel="noopener noreferrer" className="text-base text-gray-600 hover:text-blue-primary">
              UD Data Science Institute
            </a>
          </div>
        </nav>
        <div className="mt-6 flex justify-center space-x-6">
          <a href="https://www.linkedin.com/showcase/ud-data-science/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-primary">
            <span className="sr-only">LinkedIn</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        <p className="mt-6 text-center text-base text-gray-500">
          &copy; {new Date().getFullYear()} Data Science Student Association @ UD. All rights reserved.
        </p>
      </div>
    </footer>
  );
} 