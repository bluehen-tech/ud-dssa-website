import { MemberPortfolio } from '@/types/member';

export const tejasPawar: MemberPortfolio = {
  id: 'tejas-pawar',
  role: 'officer',
  position: 'Technical Lead',
  name: 'Tejas Pawar',
  email: 'tejasp@udel.edu',
  tagline: 'Master\'s Student in Data Science | AI Builder | Research Assistant',
  major: 'Data Science',
  graduationDate: 'Graduating 2026',
  bio: 'I\'m Tejas Pawar — an AI builder and researcher passionate about Generative AI, NLP, and agentic systems. I created SuNaAI Lab as a space where ideas move fast, experiments turn into projects, and knowledge is shared openly. My work explores how LLMs, semantic search, and memory-augmented systems can be transformed into real-world applications. From natural language understanding and dialogue systems to cloud-native AI deployment, I focus on creating tools that are not only technically sound but also impactful for learners, researchers, and industries.',
  profileImageUrl: '/images/members/tejas-pawar.jpg', // Add image later
  links: {
    linkedin: 'https://www.linkedin.com/in/pawar-tejas123/',
    github: 'https://github.com/tejaspawar',
    website: 'https://sunaailab.com/portfolio',
    email: 'pawar-tejas123@udel.edu',
  },
  experience: [
    {
      title: 'Graduate Assistant',
      organization: 'University of Delaware – IT Academic Technology Services',
      startDate: '2025',
      current: true,
      location: 'Newark, DE, USA',
      responsibilities: [
        'Developing agentic AI systems that enable autonomous and intelligent support for academic use cases',
        'Fine-tuning large language models (LLMs) to specialize them for education-focused tasks such as summarization, topic review, and personalized assistance',
        'Leveraging AWS Bedrock services to deploy, scale, and manage LLM-based applications in a secure cloud environment',
        'Building and maintaining backend workflows that ensure smooth integration of AI capabilities into the StudyAiDE ecosystem',
      ],
      achievements: [
        'Contributing to UD StudyAiDE project (ats.udel.edu/udstudyaide), an AI-powered platform designed to enhance teaching and learning at scale',
        'Applying Generative AI, NLP, and cloud-native deployment in a production-level academic platform',
      ],
    },
    {
      title: 'Machine Learning Intern',
      organization: 'LogicMo Systems Pvt. Ltd.',
      startDate: 'Mar 2023',
      endDate: 'Jul 2024',
      location: 'Pune, Maharashtra, India',
      responsibilities: [
        'Designed and trained computer vision models to analyze video streams and image datasets for object detection, classification, and feature extraction',
        'Implemented end-to-end ML pipelines, including preprocessing (frame extraction, noise reduction, normalization) and feature engineering',
        'Documented workflows and experimental results, ensuring reproducibility and clarity for future engineering teams',
      ],
      achievements: [
        'Optimized model performance through fine-tuning, hyperparameter tuning, and evaluation using standard CV benchmarks',
        'Applied PyTorch deep learning frameworks to deploy robust vision solutions',
        'Gained strong practical exposure to computer vision, deep learning, and applied ML engineering',
      ],
    },
    {
      title: 'Independent AI Researcher',
      organization: 'SuNaAI Lab',
      startDate: '2025',
      current: true,
      responsibilities: [
        'Building M-Maze (memory-augmented assistant), DebateGPT (AI debate system), AR cybertext, and other AI research projects',
        'Architect and sole builder of the SuNaAI Lab website and platform',
        'Experimenting with NLP pipelines, retrieval systems, and multi-agent workflows',
      ],
      achievements: [
        'Created SuNaAI Lab as a collaborative space for AI projects and research',
        'Sharing insights through blogs, posts, and collaborative learning',
      ],
    },
    {
      title: 'AI Hackathon Participant',
      organization: 'HensStreet Hacks 2025',
      startDate: 'Aug 2025',
      endDate: 'Aug 2025',
      achievements: [
        'Won Creativity & Originality Prize 🏆 for AR + GenAI project',
      ],
    },
  ],
  education: [
    {
      degree: 'Master of Science in Data Science',
      institution: 'University of Delaware',
      startYear: 2024,
      endYear: 2026,
      location: 'Newark, DE, USA',
      current: true,
      fieldOfStudy: 'Data Science',
    },
    {
      degree: 'Bachelor of Engineering in Electronics & Telecommunication',
      institution: 'Savitribai Phule Pune University',
      startYear: 2020,
      endYear: 2024,
      location: 'Pune, Maharashtra, India',
      fieldOfStudy: 'Electronics & Telecommunication',
    },
    {
      degree: 'Bachelor of Engineering Honors in Data Science',
      institution: 'Savitribai Phule Pune University',
      startYear: 2022,
      endYear: 2024,
      location: 'Pune, Maharashtra, India',
      fieldOfStudy: 'Data Science',
    },
  ],
  projects: [
    {
      title: 'M-Maze',
      description: 'Memory-augmented AI assistant using Qdrant & agentic AI. Advanced AI system with long-term memory capabilities and intelligent agent workflows.',
      technologies: ['Qdrant', 'Agentic AI', 'LLMs', 'RAG', 'Python'],
      githubUrl: 'https://github.com/tejaspawar/m-maze',
    },
    {
      title: 'DebateGPT',
      description: 'Voice-based AI debate platform using AWS Bedrock + Polly + Transcribe. Interactive debate system leveraging AWS services for natural language processing and speech synthesis.',
      technologies: ['AWS Bedrock', 'AWS Polly', 'AWS Transcribe', 'NLP', 'Python'],
      githubUrl: 'https://github.com/tejaspawar/debategpt',
    },
    {
      title: 'AR Hackathon Project',
      description: 'Real-time 3D cybertext generator using LLM + Blender + A-Frame. Award-winning project combining generative AI with augmented reality for immersive text experiences.',
      technologies: ['LLMs', 'Blender', 'A-Frame', 'AR/VR', 'Generative AI', 'JavaScript'],
    },
    {
      title: 'SuNaAI Lab Platform',
      description: 'Collaborative AI lab website and project hub. Modern web platform built with Next.js, Tailwind CSS, and Docker for showcasing AI research and projects.',
      technologies: ['Next.js', 'Tailwind CSS', 'Docker', 'React', 'TypeScript'],
      liveUrl: 'https://sunaailab.com',
      githubUrl: 'https://github.com/tejaspawar/sunaai-lab',
    },
  ],
  skills: [
    {
      category: 'AI & Data Science',
      items: ['LLMs', 'RAG', 'Fine-tuning', 'Agentic AI', 'NLP', 'AR/VR AI'],
    },
    {
      category: 'Programming',
      items: ['Python', 'PHP', 'JavaScript', 'SQL'],
    },
    {
      category: 'Frameworks/Tools',
      items: ['FastAPI', 'Flask', 'Docker', 'AWS (Bedrock, S3, Lambda)', 'GCP (Vertex AI)'],
    },
  ],
  achievements: [
    {
      title: 'Creativity & Originality Prize',
      description: 'Won for AR + GenAI project',
      date: 'Aug 2025',
      organization: 'HensStreet Hacks 2025',
    },
    {
      title: 'Project Presentations',
      description: 'Presented projects and research findings',
      organization: 'AI Makerspace, University of Delaware',
    },
    {
      title: 'Founded SuNaAI Lab',
      description: 'Created a collaborative AI lab space for AI projects and research collaboration',
      organization: 'SuNaAI Lab',
    },
  ],
  interests: [
    'Generative AI',
    'Agentic AI',
    'NLP',
    'Cloud-Native AI Deployment',
    'Open Source',
    'Research Collaboration',
  ],
};

