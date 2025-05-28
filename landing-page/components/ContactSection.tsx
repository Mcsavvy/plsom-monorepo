"use client"

import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { contactInfo, companyInfo } from "@/data"
import Link from "next/link"
import { cn } from "@/lib/utils"

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

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-white dark:bg-[#1e2436]">
      <div className="container mx-auto px-6">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-[#333333] dark:text-[#FFFFFF] mb-6 font-['Roboto_Slab']"
          >
            Contact Us
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-[#5c5c5c] dark:text-[#e0e0e0] max-w-3xl mx-auto font-['Poppins']"
          >
            Get in touch with us for more information about our programs, enrollment, or any questions you may have.
          </motion.p>
        </motion.div>

        <div className="">
          {/* Contact Information */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h3
              variants={fadeInUp}
              className="text-2xl font-bold text-[#005B99] dark:text-[#FFD700] mb-8 font-['Roboto_Slab']"
            >
              Get in Touch
            </motion.h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {contactInfo.map((info, index) => (
                <motion.div key={index} variants={fadeInUp} className="">
                  <Card className="bg-[#F5F5F5] dark:bg-[#363c4e] border-[#c2c2c2] dark:border-[#9b9b9b] hover:shadow-lg transition-all duration-300">
                    <Link href={info.link} className="p-6 block" target="_blank">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-[#005B99] dark:bg-[#FFD700] rounded-full flex items-center justify-center flex-shrink-0">
                          <info.icon className="w-6 h-6 text-white dark:text-[#005B99]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#333333] dark:text-[#FFFFFF] mb-2 font-['Poppins'] truncate">
                            {info.title}
                          </h4>
                          <p className="text-[#5c5c5c] dark:text-[#e0e0e0] text-sm font-['Poppins'] truncate">
                            {info.content}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Map with Tabs */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mt-8"
            >
              <h4 className="text-xl font-semibold text-[#005B99] dark:text-[#FFD700] mb-4 font-['Roboto_Slab']">
                Find Us
              </h4>
              
              <Tabs defaultValue="nigeria" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger 
                    value="nigeria" 
                    className="data-[state=active]:bg-[#005B99] data-[state=active]:text-white dark:data-[state=active]:bg-[#FFD700] dark:data-[state=active]:text-[#005B99]"
                  >
                    Nigeria Office
                  </TabsTrigger>
                  <TabsTrigger 
                    value="uk"
                    className="data-[state=active]:bg-[#005B99] data-[state=active]:text-white dark:data-[state=active]:bg-[#FFD700] dark:data-[state=active]:text-[#005B99]"
                  >
                    UK Office
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="nigeria" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-[#F5F5F5] dark:bg-[#363c4e] rounded-lg">
                      <MapPin className="w-5 h-5 text-[#005B99] dark:text-[#FFD700] flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-[#333333] dark:text-[#FFFFFF] mb-1">Nigeria Office</h5>
                        <p className="text-[#5c5c5c] dark:text-[#e0e0e0] text-sm">{companyInfo.address}</p>
                      </div>
                    </div>
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.5695624814166!2d3.260872188938151!3d6.449267247209439!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b890d7aa60e8d%3A0x9a155c0c1ef2315a!2sLOVE%20AND%20FAITH%20BELIEVERS%20ASSEMBLY!5e0!3m2!1sen!2sng!4v1748388571738!5m2!1sen!2sng"
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="uk" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-[#F5F5F5] dark:bg-[#363c4e] rounded-lg">
                      <MapPin className="w-5 h-5 text-[#005B99] dark:text-[#FFD700] flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-[#333333] dark:text-[#FFFFFF] mb-1">UK Office</h5>
                        <p className="text-[#5c5c5c] dark:text-[#e0e0e0] text-sm">{companyInfo.addressUK}</p>
                      </div>
                    </div>
                    <div className="rounded-lg overflow-hidden shadow-lg">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2374.1165466903444!2d-2.3471022890169237!3d53.48424736428257!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487baec28f771acb%3A0xda776018020df77f!2sHIGHLAND%20ASSOCIATES!5e0!3m2!1sen!2sng!4v1748397511289!5m2!1sen!2sng"
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}