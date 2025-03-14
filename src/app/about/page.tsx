import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-blue-hen sm:text-4xl">
            About the UD Data Science Student Association
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Empowering students through data science education, community, and real-world projects.
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-blue-hen mb-4">Our Mission</h2>
          <p className="text-lg text-gray-700 mb-6">
            The University of Delaware Data Science Student Association (UDSSA) is dedicated to fostering a vibrant 
            community of data science enthusiasts. We aim to bridge the gap between academic learning and industry 
            application by providing hands-on experiences, networking opportunities, and resources for students 
            interested in data science and related fields.
          </p>
          
          <h2 className="text-2xl font-bold text-blue-hen mb-4 mt-8">Our Vision</h2>
          <p className="text-lg text-gray-700 mb-6">
            We envision a future where UD students are recognized as top-tier data science professionals, equipped 
            with both technical expertise and practical experience. Through our initiatives, we strive to position 
            the University of Delaware as a leading institution for data science education and innovation.
          </p>

          <h2 className="text-2xl font-bold text-blue-hen mb-4 mt-8">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-hen mb-2">Workshops & Training</h3>
              <p className="text-gray-700">
                We organize regular workshops, coding sessions, and training programs on various data science 
                topics, tools, and technologies.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-hen mb-2">Industry Connections</h3>
              <p className="text-gray-700">
                We facilitate networking events with industry professionals, alumni, and potential employers 
                to create career opportunities.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-hen mb-2">Project Collaboration</h3>
              <p className="text-gray-700">
                We work on real-world data science projects, often in collaboration with local businesses, 
                non-profits, and research groups.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-hen mb-2">Community Building</h3>
              <p className="text-gray-700">
                We create a supportive environment where students can share knowledge, collaborate on 
                projects, and grow together as data scientists.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-blue-hen mb-4 mt-8">Our Team</h2>
          <p className="text-lg text-gray-700 mb-6">
            UDSSA is led by a dedicated team of student officers who are passionate about data science and 
            committed to serving the UD community. Our leadership team works closely with faculty advisors 
            and industry partners to create valuable experiences for our members.
          </p>
          
          <div className="mt-8 text-center">
            <a 
              href="/join" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-hen hover:bg-blue-800"
            >
              Join Our Community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 