"use client"

import Navigation from "@/components/Navigation"
import HeroSection from "@/components/HeroSection"
import VideoShowcase from "@/components/VideoShowcase"
import AboutSection from "@/components/AboutSection"
import VisionCarouselSection from "@/components/VisionCarouselSection"
import ProgramsSection from "@/components/ProgramsSection"
import ProgramFeatures from "@/components/ProgramFeatures"
import StatisticsSection from "@/components/StatisticsSection"
import AlumniSection from "@/components/AlumniSection"
import CoursesSection from "@/components/CoursesSection"
import EnrollmentSection from "@/components/EnrollmentSection"
import ContactSection from "@/components/ContactSection"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1e2436] transition-colors duration-300">
      <Navigation />
      <HeroSection />
      <VisionCarouselSection />
      <VideoShowcase />
      <AboutSection />
      <ProgramsSection />
      <ProgramFeatures />
      <StatisticsSection />
      <AlumniSection />
      <CoursesSection />
      <EnrollmentSection />
      <ContactSection />
      <Footer />
    </div>
  )
}
