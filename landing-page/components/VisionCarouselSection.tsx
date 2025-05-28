"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { vision, carouselImages } from "@/data"
import { Eye, ChevronRight } from "lucide-react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"

export default function VisionCarouselSection() {
  return (
    <section className="py-20 bg-plsom-bg-100 dark:bg-plsom-dark-bg-100">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Vision Section */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-plsom-accent-100 text-plsom-primary-100 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Eye className="w-4 h-4" />
                Our Vision
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-plsom-text-100 dark:text-plsom-dark-text-100 mb-6">
                Shaping Tomorrow's
                <span className="text-plsom-accent-100"> Ministry Leaders</span>
              </h2>
              <p className="text-lg text-plsom-text-200 dark:text-plsom-dark-text-200 mb-8">
                Our vision guides everything we do at PLSOM, from curriculum design to student mentorship.
              </p>
            </div>

            <div className="space-y-6">
              {vision.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-6 bg-white dark:bg-plsom-dark-bg-200 rounded-xl shadow-sm border border-plsom-bg-300 dark:border-plsom-dark-bg-300 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-plsom-accent-100 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-plsom-primary-100" />
                  </div>
                  <p className="text-plsom-text-100 dark:text-plsom-dark-text-200 leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Section */}
          <div className="relative flex flex-col items-center justify-end h-full">
            <Carousel
              plugins={[
                Autoplay({
                  delay: 4000,
                }),
              ]}
              className="w-full max-w-lg mx-auto"
            >
              <CarouselContent>
                {carouselImages.map((image) => (
                  <CarouselItem key={image.id}>
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            className="object-contain transition-transform duration-500 hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h4 className="text-white font-semibold text-lg mb-1">
                              {image.title}
                            </h4>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>

            {/* Carousel indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {carouselImages.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-plsom-bg-300 dark:bg-plsom-dark-bg-300"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 