import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  FileCheck,
  MapPin,
  Stamp,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export function InspirationDocumentsSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const slides = [
    {
      id: 'khasra-ror',
      title: t.slider.rorTitle,
      subtitle: t.slider.rorSub,
      dept: t.slider.rorDept,
      tag: t.slider.rorTag,
      link: '/land-records',
      icon: FileCheck,
      gradient: 'from-[#044e3b] via-[#065f46] to-[#0f766e]',
      badgeBg: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-200',
    },
    {
      id: 'mutation-certificate',
      title: t.slider.mutationTitle,
      subtitle: t.slider.mutationSub,
      dept: t.slider.mutationDept,
      tag: t.slider.mutationTag,
      link: '/land-records',
      icon: Stamp,
      gradient: 'from-[#0f172a] via-[#1e293b] to-[#1e3a8a]',
      badgeBg: 'bg-blue-400/20 border-blue-400/30 text-blue-200',
    },
    {
      id: 'registered-deed',
      title: t.slider.saleDeedTitle,
      subtitle: t.slider.saleDeedSub,
      dept: t.slider.saleDeedDept,
      tag: t.slider.saleDeedTag,
      link: '/land-records',
      icon: ShieldCheck,
      gradient: 'from-[#1c1917] via-[#292524] to-[#44403c]',
      badgeBg: 'bg-amber-400/20 border-amber-400/30 text-amber-200',
    },
    {
      id: 'spatial-bhu-naksha',
      title: t.slider.mapTitle,
      subtitle: t.slider.mapSub,
      dept: t.slider.mapDept,
      tag: t.slider.mapTag,
      link: '/gis',
      icon: MapPin,
      gradient: 'from-[#0c2f4d] via-[#075985] to-[#0284c7]',
      badgeBg: 'bg-cyan-400/20 border-cyan-400/30 text-cyan-200',
    },
  ];

  return (
    <section className="mb-9">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {t.slider.heading}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            {t.slider.subheading}
          </p>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="p-2 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-emerald-900 shadow-2xs transition cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="p-2 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-emerald-900 shadow-2xs transition cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'thin' }}
      >
        {slides.map((slide) => {
          const Icon = slide.icon;
          return (
            <Link
              key={slide.id}
              to={slide.link}
              className="group relative shrink-0 w-80 sm:w-88 h-52 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg border border-slate-200/90 transition-all duration-300 snap-start flex flex-col justify-between p-5.5 cursor-pointer"
            >
              {/* Background gradient & decorative visual overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-transform group-hover:scale-103 duration-300`}
              />

              {/* Cadastral grid subtle texture */}
              <div className="absolute inset-0 opacity-12 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px]" />

              {/* Top Row: Category badge & Icon */}
              <div className="relative z-10 flex items-center justify-between">
                <span
                  className={`text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full backdrop-blur-xs border ${slide.badgeBg}`}
                >
                  {slide.tag}
                </span>
                <div className="h-9 w-9 rounded-full bg-white/12 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 group-hover:bg-white/25 group-hover:scale-110 transition duration-200 shadow-xs">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>

              {/* Bottom Row: Document Title, Subtitle, Department & Action link */}
              <div className="relative z-10">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-xs group-hover:text-emerald-200 transition leading-snug">
                  {slide.title}
                </h3>
                <p className="text-[12px] font-semibold text-amber-300/95 mt-0.5">
                  {slide.subtitle}
                </p>
                <p className="text-xs font-normal text-slate-200/90 truncate mt-1">
                  {slide.dept}
                </p>

                <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-amber-300 transition">
                  <span>{t.slider.pullDocument}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
