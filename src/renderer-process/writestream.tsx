import { useState } from 'react';
import { FileText, MessageSquare, BookOpen, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------------------- */

export default function WriteStream() {
    const navigate = useNavigate();

    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* SVG Background - Misty Mountains */}
            <div className="absolute inset-0 z-0">
                <svg
                    className="w-full h-full"
                    viewBox="0 0 1920 1080"
                    preserveAspectRatio="xMidYMid slice"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#7A8A99', stopOpacity: 1 }} />
                            <stop offset="30%" style={{ stopColor: '#E8C4D8', stopOpacity: 0.6 }} />
                            <stop offset="60%" style={{ stopColor: '#F4B5A0', stopOpacity: 0.5 }} />
                            <stop offset="100%" style={{ stopColor: '#F4C4B0', stopOpacity: 0.4 }} />
                        </linearGradient>

                        <filter id="blur">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                        </filter>
                    </defs>

                    {/* Sky */}
                    <rect width="1920" height="1080" fill="url(#skyGradient)" />

                    {/* Mist layers */}
                    <ellipse cx="960" cy="700" rx="900" ry="200" fill="#B8C5D0" opacity="0.3" filter="url(#blur)" />
                    <ellipse cx="500" cy="650" rx="600" ry="150" fill="#E8C4D8" opacity="0.2" filter="url(#blur)" />
                    <ellipse cx="1400" cy="720" rx="700" ry="180" fill="#B8C5D0" opacity="0.25" filter="url(#blur)" />

                    {/* Mountain layers - furthest back */}
                    <path d="M0,500 Q200,400 400,450 T800,420 T1200,480 T1600,440 T1920,500 L1920,1080 L0,1080 Z"
                        fill="#7A8A99" opacity="0.3" />

                    <path d="M0,550 Q300,480 600,520 T1000,500 T1400,540 T1920,520 L1920,1080 L0,1080 Z"
                        fill="#2C3E50" opacity="0.4" />

                    {/* Mid-distance mountains */}
                    <path d="M0,620 Q250,540 500,590 T900,570 T1300,610 T1700,580 T1920,620 L1920,1080 L0,1080 Z"
                        fill="#2C3E50" opacity="0.6" />

                    {/* Foreground mountain peak */}
                    <path d="M600,800 L750,600 L820,680 L900,550 L980,650 L1050,700 L1100,750 L1920,900 L1920,1080 L0,1080 L0,900 Z"
                        fill="#1A252F" opacity="0.85" />

                    {/* Dense fog in valley */}
                    <ellipse cx="960" cy="850" rx="1200" ry="150" fill="#F8F9FA" opacity="0.6" filter="url(#blur)" />
                    <ellipse cx="700" cy="820" rx="800" ry="120" fill="#FFFFFF" opacity="0.4" filter="url(#blur)" />
                </svg>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">

                {/* Logo/Title */}
                <div className="text-center mb-12 animate-fadeIn">

                    <h1 className="text-4xl md:text-5xl font-semibold text-[#2C3E50] mb-2"
                        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                        Write Once. Post Everywhere.
                    </h1>
                </div>

                {/* Main CTAs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-16">

                    {/* Write Post CTA */}
                    <div
                        className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-8 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-transparent hover:border-[#F4B5A0]"
                        style={{
                            boxShadow: hoveredCard === 'post' ? '0 8px 24px rgba(244, 181, 160, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)'
                        }}
                        onMouseEnter={() => setHoveredCard('post')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-[#F4B5A0]/20 flex items-center justify-center mb-4 group-hover:bg-[#F4B5A0]/30 transition-colors duration-300">
                                <MessageSquare className="w-8 h-8 text-[#F4B5A0]" strokeWidth={2} />
                            </div>
                            <h2 className="text-2xl font-semibold text-[#2C3E50] mb-2">
                                Write a Post
                            </h2>
                            <p className="text-[#7A8A99] mb-6">
                                Quick thoughts for Twitter, LinkedIn, and more
                            </p>
                            <div className="mt-auto pt-4">
                                <span className="inline-flex items-center gap-2 text-[#F4B5A0] font-medium group-hover:gap-3 transition-all duration-300">
                                    Start writing
                                    <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Write Article CTA */}
                    <div
                        className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-8 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-transparent hover:border-[#E8C4D8]"
                        style={{
                            boxShadow: hoveredCard === 'article' ? '0 8px 24px rgba(232, 196, 216, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)'
                        }}
                        onMouseEnter={() => setHoveredCard('article')}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => navigate("/editor")}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-[#E8C4D8]/20 flex items-center justify-center mb-4 group-hover:bg-[#E8C4D8]/30 transition-colors duration-300">
                                <FileText className="w-8 h-8 text-[#E8C4D8]" strokeWidth={2} />
                            </div>
                            <h2 className="text-2xl font-semibold text-[#2C3E50] mb-2">
                                Write an Article
                            </h2>
                            <p className="text-[#7A8A99] mb-6">
                                Long-form content for Medium, blogs, and beyond
                            </p>
                            <div className="mt-auto pt-4">
                                <span className="inline-flex items-center gap-2 text-[#E8C4D8] font-medium group-hover:gap-3 transition-all duration-300">
                                    Start writing
                                    <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Published & Drafts Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">

                    {/* Published */}
                    <div
                        className="group bg-white/80 backdrop-blur-sm rounded-lg p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:bg-white/95 border border-[#B8C5D0]/30 hover:border-[#7A8A99]/50"
                        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-[#7A8A99]/10 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-[#7A8A99]" strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#2C3E50] mb-1">
                                        Published
                                    </h3>
                                    <p className="text-sm text-[#7A8A99]">
                                        View your live content
                                    </p>
                                </div>
                            </div>
                            <div className="text-2xl font-semibold text-[#7A8A99]">
                                12
                            </div>
                        </div>
                    </div>

                    {/* Drafts */}
                    <div
                        className="group bg-white/80 backdrop-blur-sm rounded-lg p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:bg-white/95 border border-[#B8C5D0]/30 hover:border-[#E8C4D8]/50"
                        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-[#E8C4D8]/10 flex items-center justify-center">
                                    <Edit3 className="w-6 h-6 text-[#E8C4D8]" strokeWidth={2} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#2C3E50] mb-1">
                                        Drafts
                                    </h3>
                                    <p className="text-sm text-[#7A8A99]">
                                        Continue your work
                                    </p>
                                </div>
                            </div>
                            <div className="text-2xl font-semibold text-[#E8C4D8]">
                                5
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
        </div>
    );
}