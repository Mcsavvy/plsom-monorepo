"use client"

import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { companyInfo, footerLinks, navItems, socialLinks } from "@/data"

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function Footer() {
  return (
    <footer className="bg-[#333333] dark:bg-[#0F1626] text-white">
      <div className="container mx-auto px-6 py-16">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {/* About Section */}
          <motion.div variants={fadeInUp} className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-[#FFD700] mb-4 font-['Roboto_Slab']">
              {companyInfo.fullName}
            </h3>
            <p className="text-white/80 mb-6 font-['Poppins'] leading-relaxed">
              {companyInfo.description}
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/90 text-sm font-medium block">Nigeria Office:</span>
                  <span className="text-white/80 text-sm">{companyInfo.address}</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-white/90 text-sm font-medium block">UK Office:</span>
                  <span className="text-white/80 text-sm">{companyInfo.addressUK}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                <span className="text-white/80 text-sm">{companyInfo.phoneUK} (UK) | {companyInfo.phone} (Nigeria)</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                <span className="text-white/80 text-sm">{companyInfo.email}</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={fadeInUp}>
            <h4 className="text-lg font-semibold text-[#FFD700] mb-4 font-['Poppins']">Quick Links</h4>
            <ul className="space-y-2">
              {footerLinks.quickLinks.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="text-white/80 hover:text-[#FFD700] transition-colors duration-300 text-sm font-['Poppins']"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Programs */}
          <motion.div variants={fadeInUp}>
            <h4 className="text-lg font-semibold text-[#FFD700] mb-4 font-['Poppins']">Programs</h4>
            <ul className="space-y-2">
              {footerLinks.programs.map((program, index) => (
                <li key={index}>
                  <a href={program.href} className="text-white/80 hover:text-[#FFD700] transition-colors duration-300 text-sm font-['Poppins']">
                    {program.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Social Media & Copyright */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mt-12 pt-8 border-t border-white/20"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <motion.div variants={fadeInUp} className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <a key={index} href={link.href} className="text-white/60 hover:text-[#FFD700] text-xs transition-colors duration-300">
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center md:text-right">
              <p className="text-white/60 text-sm font-['Poppins']">
                {companyInfo.copyright}
              </p>
              <div className="flex flex-wrap justify-center md:justify-end space-x-4 mt-2">
                <a
                  href="#"
                  className="text-white/60 hover:text-[#FFD700] text-xs transition-colors duration-300"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-white/60 hover:text-[#FFD700] text-xs transition-colors duration-300"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-white/60 hover:text-[#FFD700] text-xs transition-colors duration-300"
                >
                  Accessibility
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
} 