import { Link } from 'react-router-dom';
import { useLanguage, type SupportedLanguage } from '../../../context/LanguageContext';
import {
  ArrowRight,
  Bot,
  Building2,
  ChevronRight,
  FileCheck2,
  FileText,
  Landmark,
  MapPin,
  Scale,
  Trees,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'cadastral',
    title: 'Cadastral & Spatial Parcels',
    description: 'PostGIS boundary polygons, survey numbers, khasra & khatauni records',
    count: '4,280+ Parcels',
    icon: MapPin,
    iconColor: 'text-emerald-700 bg-emerald-50',
    borderColor: 'hover:border-emerald-300',
    to: '/explore?domain=cadastral',
  },
  {
    id: 'governance',
    title: 'State Revenue Governance',
    description: 'District revenue KPIs, mutation velocity, and revenue court pendency',
    count: '52 Districts',
    icon: Landmark,
    iconColor: 'text-teal-700 bg-teal-50',
    borderColor: 'hover:border-teal-300',
    to: '/explore?domain=governance',
  },
  {
    id: 'acquisition',
    title: 'Land Acquisition (RFCTLARR)',
    description: 'Social impact assessment, 100% Solatium, and compensation awards',
    count: '180+ Regulations',
    icon: Scale,
    iconColor: 'text-blue-700 bg-blue-50',
    borderColor: 'hover:border-blue-300',
    to: '/explore?q=RFCTLARR',
  },
  {
    id: 'tenancy',
    title: 'Agricultural Land Leasing',
    description: 'Model leasing rules, cultivator security, and dispute resolution',
    count: '65+ Model Policies',
    icon: FileCheck2,
    iconColor: 'text-purple-700 bg-purple-50',
    borderColor: 'hover:border-purple-300',
    to: '/explore?q=leasing',
  },
  {
    id: 'dilrmp',
    title: 'Digitization & Resurvey (DILRMP)',
    description: 'Computerization guidelines, drone resurvey, and digital registration',
    count: '110+ Circulars',
    icon: FileText,
    iconColor: 'text-amber-700 bg-amber-50',
    borderColor: 'hover:border-amber-300',
    to: '/explore?q=DILRMP',
  },
  {
    id: 'forest',
    title: 'Forest & Tribal Rights (FRA)',
    description: 'Forest Rights Act 2006, community tenure, and eco-sensitive land',
    count: '95+ Gazettes',
    icon: Trees,
    iconColor: 'text-green-700 bg-green-50',
    borderColor: 'hover:border-green-300',
    to: '/explore?q=forest',
  },
  {
    id: 'urban',
    title: 'Urban Planning & Land Use',
    description: 'Master plans, land use conversion rules, and building bye-laws',
    count: '140+ Bye-Laws',
    icon: Building2,
    iconColor: 'text-sky-700 bg-sky-50',
    borderColor: 'hover:border-sky-300',
    to: '/explore?q=urban',
  },
  {
    id: 'ai-corpus',
    title: 'Statutory AI Q&A Corpus',
    description: 'Verbatim revenue act citations and vector-indexed legal intelligence',
    count: '1,240+ Citations',
    icon: Bot,
    iconColor: 'text-indigo-700 bg-indigo-50',
    borderColor: 'hover:border-indigo-300',
    to: '/explore?domain=assistant',
  },
];


const HEADINGS: Record<SupportedLanguage, { tag: string; title: string; subtitle: string }> = {
  en: {
    tag: 'National Land Repository',
    title: 'Explore Land Governance by Categories',
    subtitle: 'Discover digitized land records, spatial boundaries, and statutory instruments organized across key administrative domains.',
  },
  hi: {
    tag: 'राष्ट्रीय भूमि संग्रह',
    title: 'श्रेणियों द्वारा भूमि शासन का अन्वेषण करें',
    subtitle: 'प्रमुख प्रशासनिक क्षेत्रों में आयोजित डिजिटलीकृत भू-अभिलेख, स्थानिक सीमाएं और वैधानिक दस्तावेज देखें।',
  },
  mr: {
    tag: 'राष्ट्रीय जमीन भांडार',
    title: 'श्रेणीनुसार जमीन प्रशासनाचा शोध घ्या',
    subtitle: 'महत्वाच्या प्रशासकीय विभागांनुसार आयोजित संगणकीकृत जमीन अभिलेख, भौगोलिक सीमा आणि कायदे शोधा.',
  },
  te: {
    tag: 'జాతీయ భూ భాండాగారం',
    title: 'వర్గాల వారీగా భూ పరిపాలనను అన్వేషించండి',
    subtitle: 'కీలక పరిపాలనా విభాగాలలో నిర్వహించబడిన డిజిటలైజ్డ్ భూ రికార్డులు, సరిహద్దులు మరియు చట్టబద్ధమైన పత్రాలను కనుగొనండి.',
  },
};

export function ExploreCategoriesSection() {
  const { language } = useLanguage();
  const info = HEADINGS[language] || HEADINGS.en;

  return (
    <section aria-labelledby="categories-heading" className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading (DigiLocker Style) */}
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block">
            {info.tag}
          </span>
          <h2 id="categories-heading" className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
            {info.title}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
            {info.subtitle}
          </p>
        </div>

        {/* Categories Grid (DigiLocker 4x2 responsive cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={cat.to}
                className={`group flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${cat.borderColor}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cat.iconColor} group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {cat.title}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                    {cat.description}
                  </p>
                  <span className="inline-block text-[10px] font-bold text-blue-600 mt-2 bg-blue-50/80 px-2 py-0.5 rounded-md">
                    {cat.count}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Categories CTA */}
        <div className="mt-10 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs hover:border-blue-600 hover:text-blue-700 hover:bg-blue-50/30 transition"
          >
            <span>Explore All Land Governance Categories</span>
            <ArrowRight className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
