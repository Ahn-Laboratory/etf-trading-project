"use client"

import ScrollSequence from "@/components/landing/scroll-sequence"
import Image from "next/image"
import Link from "next/link"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeroSection } from "@/components/landing/hero-section"
import { TimelineSection } from "@/components/landing/timeline-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TechSection } from "@/components/landing/tech-section"

export default function LandingPage() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-black">
      <ScrollSequence frameCount={192} />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#002B5B]/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon.png"
                alt="ETF Trading Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-semibold text-white">Snowballing AI ETF</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white hover:text-[#00E5FF]">
                  대시보드
                </Button>
              </Link>
              <Link href="/predictions">
                <Button variant="ghost" className="text-white hover:text-[#00E5FF]">
                  예측 결과
                </Button>
              </Link>
              <Link href="/factsheet">
                <Button variant="ghost" className="text-white hover:text-[#00E5FF]">
                  팩트시트
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <div className="bg-black/40 backdrop-blur-md">
            <HeroSection />
            <TimelineSection />
            <FeaturesSection />
            <TechSection />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-black/60 backdrop-blur-md text-white py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Image
                    src="/icon.png"
                    alt="ETF Trading Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                  <span className="font-semibold">Snowballing AI ETF</span>
                </div>
                <p className="text-gray-400 text-sm max-w-md">
                  AI 기반 수익률 예측과 규제 대응 설계를 완료한 차세대 Active ETF 솔루션입니다.
                  데이터가 증명하는 투명한 운용을 약속합니다.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">서비스</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <Link href="/dashboard" className="hover:text-[#00E5FF]">
                      대시보드
                    </Link>
                  </li>
                  <li>
                    <Link href="/predictions" className="hover:text-[#00E5FF]">
                      예측 결과
                    </Link>
                  </li>
                  <li>
                    <Link href="/portfolio" className="hover:text-[#00E5FF]">
                      포트폴리오
                    </Link>
                  </li>
                  <li>
                    <Link href="/factsheet" className="hover:text-[#00E5FF]">
                      팩트시트
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">정보</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>
                    <Link href="/returns" className="hover:text-[#00E5FF]">
                      수익률 분석
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                &copy; 2025 Snowballing AI ETF. All rights reserved.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollToTop}
                className="text-gray-400 hover:text-[#00E5FF]"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                맨 위로
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
