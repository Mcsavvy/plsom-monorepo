import {
  BookOpen,
  Users,
  Award,
  Heart,
  Target,
  GraduationCap,
  Clock,
  Calendar,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  Flame,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
} from "lucide-react"

// Navigation items
export const navItems = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Programs", href: "#programs" },
  { name: "Courses", href: "#courses" },
  { name: "Enroll", href: "#enroll" },
  { name: "Contact", href: "#contact" },
]

// About sections data
export const aboutSections = [
  {
    id: "spiritual",
    title: "Spiritual Development",
    icon: Flame,
    verse: "Isaiah 11:20",
    content:
      "The Spirit of the LORD will rest on Him—the Spirit of wisdom and understanding, the Spirit of counsel and strength, the Spirit of knowledge and fear of the LORD",
    details:
      `At PLSOM, we prayerfully and practically impart in you the Spirit and Grace to thrive and grow in the word of God through revelation from the Holy Spirit (1Timothy 4:14). Our desire and commitment is to see your spirit man developed and aligned with the Spirit of God who will help you to discover the unique purpose of God for you. You will have the opportunity to identify and manifest the divine gifts bestowed upon you by the Holy spirit and will be trained to use them effectively for Kingdom purposes.`,
  },
  {
    id: "mission",
    title: "Mission & Evangelism",
    icon: Globe,
    verse: "Acts 1:8",
    content:
      "But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.",
    details: `At PLSOM, we train Missionaries, Evangelists and people with Apostolic calling to fulfil their God given Mandates here on earth. The world is waiting for the manifestations of the sons and daughters of God. Those who will take the gospel far and wide.`,
  },
  {
    id: "personal",
    title: "Personal Development",
    icon: Award,
    verse: "James 1:4",
    content: "But let patience have its perfect work, that you may be perfect and complete, lacking nothing",
    details: `At PLSOM, we engage, initiate and promote activities designed to improve talents, potentials, self discipline; and instill Godly principles that would enable a minister develop skills essential for both future ministry work and general life challenges. A servant of God must be productive in the society, have important skills to grow wealth and networks, be capable to effectively managing opportunities and people.`,
  },
  {
    id: "mentorship",
    title: "Ongoing Mentorship",
    icon: Users,
    verse: "1 Peter 5:1-5",
    content:
      "I exhort the elders among you, as a fellow elder and a witness of the sufferings of Christ, as well as a partaker in the glory that is going to be revealed: shepherd the flock of God that is among you, exercising oversight, not under compulsion, but willingly, as God would have you; not for shameful gain, but eagerly; not domineering over those in your charge.",
    details: `At PLSOM, we do not just train, but we mentor Ministers even after graduating from School of Ministry. We will work with you, pray with you, support you to become a Complete as a minister of God.`,
  },
]

// Vision data
export const vision = [
  "To practically and spiritually train future Ministers in preparation for the apostolic Mandate released on the saints of God in this end time.",
  "To build a conducive learning environment and Holy Ghost inspired culture through revelational teaching of the word and prayerfully seeking the will of God to be done here on earth.",
  "To uphold and impact the gospel of Jesus Christ in totality; without compromise and prejudice"
]

// Carousel images data
export const carouselImages = [
  {
    id: 1,
    src: "/gallery/commissioning.jpg",
    alt: "Commissioning",
    title: "Commissioning of Ministers"
  },
  {
    id: 2,
    src: "/gallery/training.jpg",
    alt: "Training",
    title: "Training of Ministers"
  },
  {
    id: 3,
    src: "/gallery/flyer.jpg",
    alt: "Flyer",
    title: "Flyer"
  },
]

// Video showcase data
export const videoShowcase = [
  {
    title: "Welcome to PLSOM",
    description: "Discover our mission and vision for ministry training",
    thumbnail: "/placeholder.svg?height=200&width=350",
    duration: "2:30",
    category: "Introduction",
  },
  {
    title: "Student Life & Community",
    description: "See how our students grow together in faith and learning",
    thumbnail: "/placeholder.svg?height=200&width=350",
    duration: "3:45",
    category: "Campus Life",
  },
  {
    title: "Graduate Success Stories",
    description: "Hear from alumni making impact around the world",
    thumbnail: "/placeholder.svg?height=200&width=350",
    duration: "4:20",
    category: "Testimonials",
  },
  {
    title: "Online Learning Experience",
    description: "Explore our flexible online learning platform",
    thumbnail: "/placeholder.svg?height=200&width=350",
    duration: "3:15",
    category: "Technology",
  },
  {
    title: "Faculty & Mentorship",
    description: "Meet our experienced ministry leaders and educators",
    thumbnail: "/placeholder.svg?height=200&width=350",
    duration: "2:50",
    category: "Faculty",
  },
  {
    title: "Practical Ministry Training",
    description: "See hands-on training and real-world application",
    thumbnail: "/placeholder.svg?height=200&width=350",
    duration: "4:10",
    category: "Training",
  },
]

// Programs data
export const programs = [
  {
    id: "certificate",
    title: "Certificate Level 2 Practical Ministry",
    duration: "Foundation Program",
    level: "Beginner to Intermediate",
    totalModules: 6,
    estimatedTime: "7 months",
    modules: [
      "Church Administration",
      "Acts of Apostles",
      "Doctrine 101",
      "The Pastoral",
      "Evangelism",
      "Eschatology",
    ],
    practicum: [],
    assessment: ["Portfolio", "Essay", "Exam"],
    image: "/programs/certificate.jpeg?height=300&width=400",
    format: "online / in class",
  },
  {
    id: "diploma",
    title: "Diploma Level 3 Practical Ministry",
    duration: "Advanced Program",
    level: "Intermediate to Advanced",
    totalModules: 7,
    estimatedTime: "14 months",
    modules: [
      "Church Planting and Missions",
      "Ministerial Ethics",
      "The Five Fold Ministry",
      "ADR (Conflict Resolution)",
      "Dispensations Of God",
      "Christian Apologetic (unravelling doctrines)",
      "Hermenetics and Homiletics",
    ],
    assessment: ["Exam", "Coursework", "Dissertations"],
    outcomes: [
      "Advanced ministry leadership",
      "Church planting expertise",
      "Specialized ministry skills",
      "Mentorship capabilities",
    ],
    image: "/programs/diploma.jpeg?height=300&width=400",
    format: "online / in class",
  },
]

// Program features data
export const programFeatures = [
  {
    icon: GraduationCap,
    title: "Expert Faculty",
    description: "Learn from experienced ministers and educators",
    details: [
      "Seasoned ministry professionals",
      "Academic excellence combined with practical wisdom",
      "Diverse backgrounds in various ministry fields",
      "Committed to student success and growth",
    ],
  },
  {
    icon: Clock,
    title: "Flexible Schedule",
    description: "Programs designed to accommodate your commitments",
    details: [
      "Evening and weekend classes available",
      "Online and hybrid learning options",
      "Self-paced study modules",
      "Work-friendly scheduling",
    ],
  },
  {
    icon: Heart,
    title: "Mentorship",
    description: "One-on-one guidance from experienced ministers",
    details: [
      "Personal mentorship relationships",
      "Regular one-on-one meetings",
      "Spiritual guidance and support",
      "Career and ministry development advice",
    ],
  },
  {
    icon: Users,
    title: "Practical Training",
    description: "Hands-on experience in real ministry settings",
    details: [
      "Church attachment programs",
      "Community outreach opportunities",
      "Real-world ministry experience",
      "Supervised practical application",
    ],
  },
]

// Statistics data
export const statistics = [
  {
    number: "500+",
    label: "Graduates Equipped",
    description: "Ministers trained and equipped for effective service",
    icon: GraduationCap,
  },
  {
    number: "150+",
    label: "Churches Planted",
    description: "New churches established by our graduates worldwide",
    icon: Heart,
  },
  {
    number: "25+",
    label: "Countries Reached",
    description: "Nations impacted through our alumni's ministry work",
    icon: Target,
  },
  {
    number: "95%",
    label: "Success Rate",
    description: "Graduates actively serving in ministry roles",
    icon: Award,
  },
]

// Additional statistics
export const additionalStats = [
  {
    title: "Years of Excellence",
    value: "15+",
    description: "Dedicated to ministry training since 2009",
  },
  {
    title: "Faculty Members",
    value: "20+",
    description: "Experienced ministers and educators",
  },
  {
    title: "Course Modules",
    value: "74+",
    description: "Comprehensive curriculum modules available",
  },
]

// Alumni data
export const featuredAlumni = [
  {
    name: "Pastor Sarah Johnson",
    title: "Senior Pastor & Church Planter",
    church: "New Life Community Church",
    location: "Lagos, Nigeria",
    year: "Class of 2018",
    achievement: "Planted 5 churches across West Africa",
    quote: "PLSOM equipped me with both spiritual depth and practical skills needed for effective ministry.",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    name: "Rev. Michael Chen",
    title: "Missionary & Evangelist",
    church: "Asian Missions Network",
    location: "Singapore",
    year: "Class of 2019",
    achievement: "Established ministry in 8 Asian countries",
    quote: "The mentorship program at PLSOM continues to guide my ministry decisions even today.",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    name: "Dr. Grace Okafor",
    title: "Ministry Leader & Author",
    church: "Women in Ministry International",
    location: "London, UK",
    year: "Class of 2017",
    achievement: "Authored 3 books on women's ministry",
    quote: "PLSOM's holistic approach prepared me for ministry leadership beyond my expectations.",
    image: "/placeholder.svg?height=300&width=300",
  },
]

// Alumni success stories
export const alumniSuccessStories = [
  {
    icon: Heart,
    title: "Church Planting Success",
    description:
      "Over 150 churches have been planted by our graduates across 25 countries, with many becoming thriving community centers.",
  },
  {
    icon: Users,
    title: "Leadership Development",
    description:
      "85% of our graduates hold leadership positions in their churches or ministry organizations within 2 years of graduation.",
  },
  {
    icon: BookOpen,
    title: "Continued Education",
    description:
      "60% of our alumni pursue advanced theological education, with many earning master's and doctoral degrees.",
  },
  {
    icon: Target,
    title: "Global Impact",
    description:
      "Our alumni serve in missions across Africa, Asia, Europe, and the Americas, spreading the gospel worldwide.",
  },
]

// Enrollment steps data
export const enrollmentSteps = [
  {
    icon: FileText,
    title: "Submit Application",
    description: "Complete our online application form with your personal information, and program preferences.",
    timeline: "5-10 minutes"
  },
  {
    icon: CheckCircle,
    title: "Application Review",
    description: "Our admissions team will review your application and may contact you for additional information or clarification.",
    timeline: "3-5 business days"
  },
  {
    icon: Users,
    title: "Interview Process",
    description: "Participate in a brief interview with our ministry leaders to discuss your calling and program fit.",
    timeline: "30-45 minutes"
  },
  {
    icon: GraduationCap,
    title: "Enrollment Confirmation",
    description: "Receive your acceptance letter and complete enrollment by submitting required documents and payment.",
    timeline: "1-2 business days"
  }
]

// Enrollment requirements data
export const enrollmentRequirements = [
  "Brief essay describing your ministry calling and goals",
  "Commitment to complete the full program duration",
  "Access to reliable internet connection (for online components)",
  "Willingness to participate in practical ministry assignments"
]

// Courses data
export const courses = [
  {
    category: "Foundation Courses",
    description: "Essential courses for building a strong ministry foundation",
    courses: [
      {
        title: "Church Administration",
        code: "CA-101",
        modules: 10,
        duration: "12 weeks",
        description:
          "Learn the fundamentals of church management, leadership principles, and administrative best practices.",
        topics: [
          "Leadership Principles",
          "Financial Management",
          "Team Building",
          "Strategic Planning",
          "Communication Skills",
        ],
      },
      {
        title: "Acts of Apostles",
        code: "AA-102",
        modules: 5,
        duration: "6 weeks",
        description: "Deep dive into the book of Acts, understanding early church practices and apostolic ministry.",
        topics: [
          "Early Church History",
          "Apostolic Ministry",
          "Church Planting",
          "Evangelism Methods",
          "Spiritual Gifts",
        ],
      },
      {
        title: "Doctrine 101",
        code: "DOC-103",
        modules: 6,
        duration: "8 weeks",
        description: "Fundamental Christian doctrines and theological foundations for ministry.",
        topics: ["Trinity", "Salvation", "Scripture", "Church", "Eschatology"],
      },
    ],
  },
  {
    category: "Ministry Development",
    description: "Advanced courses for developing specific ministry skills",
    courses: [
      {
        title: "The Pastoral",
        code: "PAS-201",
        modules: 5,
        duration: "6 weeks",
        description: "Comprehensive training for pastoral ministry and shepherding God's people.",
        topics: ["Pastoral Care", "Counseling", "Preaching", "Discipleship", "Crisis Management"],
      },
      {
        title: "Evangelism",
        code: "EVA-202",
        modules: 3,
        duration: "4 weeks",
        description: "Effective evangelism strategies and personal witnessing techniques.",
        topics: ["Personal Evangelism", "Mass Evangelism", "Cross-Cultural Ministry", "Apologetics", "Follow-up"],
      },
      {
        title: "Church Planting and Mission",
        code: "CPM-301",
        modules: 10,
        duration: "14 weeks",
        description: "Strategic church planting and missionary work in various contexts.",
        topics: [
          "Church Planting Strategy",
          "Cultural Adaptation",
          "Leadership Development",
          "Sustainability",
          "Multiplication",
        ],
      },
    ],
  },
  {
    category: "Advanced Studies",
    description: "Specialized courses for experienced ministers",
    courses: [
      {
        title: "Hermeneutics and Homiletics",
        code: "HH-401",
        modules: 6,
        duration: "8 weeks",
        description: "Biblical interpretation and effective preaching techniques.",
        topics: [
          "Biblical Interpretation",
          "Sermon Preparation",
          "Delivery Techniques",
          "Contextual Preaching",
          "Expository Methods",
        ],
      },
      {
        title: "Christian Apologetics",
        code: "APO-402",
        modules: 4,
        duration: "6 weeks",
        description: "Defending the Christian faith in contemporary contexts.",
        topics: [
          "Philosophical Foundations",
          "Historical Evidence",
          "Scientific Apologetics",
          "Comparative Religion",
          "Practical Application",
        ],
      },
      {
        title: "Ministerial Ethics and Development",
        code: "MED-403",
        modules: 5,
        duration: "6 weeks",
        description: "Ethical foundations and personal development for ministry leaders.",
        topics: [
          "Professional Ethics",
          "Personal Integrity",
          "Conflict Resolution",
          "Leadership Development",
          "Accountability",
        ],
      },
    ],
  },
]

// Footer links
export const footerLinks = {
  quickLinks: [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Programs", href: "#programs" },
    { name: "Enroll", href: "#enroll" },
  ],
  programs: [
    { name: "Certificate Level 2 Practical Ministry", href: "#program-certificate" },
    { name: "Diploma Level 3 Practical Ministry", href: "#program-diploma" },
  ],
}

// Social media links
export const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Mail, href: "mailto:contact@perfectloveschoolofministry.com", label: "Email" },
]

// Company information
export const companyInfo = {
  name: "PLSOM",
  fullName: "Perfect Love School of Ministry",
  description:
    "Perfect Love School of Ministry is devoted to training and guiding the next generation of Ministry leaders, empowering them to shape society for the glory of Jesus Christ.",
  address: "51a, Marwa Road, Ijegun Satellite Town, Lagos, Nigeria",
  addressUK: "Suite 2, bright house bright road. Eccles. m30 0wg",
  phone: "+2348147827057",
  phoneUK: "+447881765201",
  phoneWhatsApp: "+2348147827057",
  email: "contact@perfectloveschoolofministry.com",
  copyright: `© ${new Date().getFullYear()} Perfect Love School of Ministry. All rights reserved.`,
};

// Contact information
export const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    content: companyInfo.email,
    link: `mailto:${companyInfo.email}`,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Us",
    content: companyInfo.phoneWhatsApp,
    link: `https://wa.me/${companyInfo.phoneWhatsApp
      .replace(/\s+/g, "")
      .replace(/\+/g, "")}?text=${encodeURIComponent(
      "Hello! I'm interested in learning more about PLSOM programs."
    )}`,
  },
  {
    icon: Phone,
    title: "Call Us (UK)",
    content: companyInfo.phoneUK,
    link: `tel:${companyInfo.phoneUK.replace(/\s+/g, "")}`,
  },
  {
    icon: Phone,
    title: "Call Us (Nigeria)",
    content: companyInfo.phone,
    link: `tel:${companyInfo.phone.replace(/\s+/g, "")}`,
  },
  {
    icon: MapPin,
    title: "Visit Us (Nigeria)",
    content: companyInfo.address,
    link: `https://maps.google.com/?q=${encodeURIComponent(
      "C7V6+98H, BUBA MARWA ROAD ALIMOSHO, Satellite Town, Lagos"
    )}`,
  },
  {
    icon: MapPin,
    title: "Visit Us (UK)",
    content: companyInfo.addressUK,
    link: `https://maps.google.com/?q=${encodeURIComponent(
      "Suite 2, Bright House, Business Centre, Bright Rd, Eccles, Manchester M30 0WG, United Kingdom"
    )}`,
  },
];


// Why choose us reasons
export const whyChooseUs = [
  "Practical mentorship before and after graduation",
  "Practical skills you can apply immediately",
  "Online learning for ultimate flexibility",
  "Spirit filled Ministers as trainers",
  "Vibrant and impactful training",
] 