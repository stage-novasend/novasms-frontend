import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Code, Video, FileText, ArrowRight } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Ressources() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const resources = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Centre d'aide",
      desc: 'Guides étape par étape pour configurer vos campagnes, automatisations et intégrations.',
      link: '#',
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: 'Documentation API',
      desc: 'Référence complète des endpoints, webhooks et exemples de code pour développeurs.',
      link: '#',
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: 'Webinaires & Tutoriels',
      desc: 'Sessions live et replays pour maîtriser les fonctionnalités avancées de NovaSMS.',
      link: '#',
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Études de cas',
      desc: 'Découvrez comment des entreprises comme la vôtre ont multiplié leur ROI avec NovaSMS.',
      link: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body antialiased">
      {/* NAVBAR */}
      <nav
        className={`h-20 w-full fixed top-0 left-0 z-50 glass-header border-b border-outline-variant/30 px-6 lg:px-12 flex items-center justify-between transition-all duration-300 ${isScrolled ? 'backdrop-blur-md' : ''}`}
      >
        <div className="flex items-center gap-12">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-headline font-extrabold text-2xl tracking-tight text-secondary">
              NovaSMS
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-8">
            <a
              href="/produit"
              className="text-sm font-semibold text-secondary/70 hover:text-primary transition-colors"
            >
              Produit
            </a>
            <a
              href="/solutions"
              className="text-sm font-semibold text-secondary/70 hover:text-primary transition-colors"
            >
              Solutions
            </a>
            <a
              href="/tarifs"
              className="text-sm font-semibold text-secondary/70 hover:text-primary transition-colors"
            >
              Tarifs
            </a>
            <a
              href="/ressources"
              className="text-sm font-semibold text-secondary/70 hover:text-primary transition-colors"
            >
              Ressources
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="text-sm font-bold text-secondary hover:bg-surface-variant/50 px-5 py-2.5 rounded-lg transition-all"
          >
            Connexion
          </a>
          <a
            href="/register"
            className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            Inscription
          </a>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="font-headline text-5xl lg:text-6xl font-extrabold text-secondary tracking-tight mb-6">
              Ressources & Documentation
            </h1>
            <p className="text-xl text-on-surface-variant">
              Tout ce dont vous avez besoin pour réussir vos campagnes marketing de précision.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {resources.map((res, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-outline-variant/30 hover:border-primary/50 hover:shadow-xl transition-all group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all mb-6">
                  {res.icon}
                </div>
                <h3 className="font-headline text-2xl font-bold text-secondary mb-3">
                  {res.title}
                </h3>
                <p className="text-on-surface-variant mb-6">{res.desc}</p>
                <span className="flex items-center gap-2 text-primary font-bold group-hover:gap-3 transition-all">
                  Consulter <ArrowRight className="w-4 h-4" />
                </span>
              </motion.div>
            ))}
          </div>

          <div className="bg-surface-variant/30 rounded-[32px] p-12 lg:p-16 border border-outline-variant/20">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="font-headline text-3xl font-bold text-secondary mb-2">
                  Restez à jour
                </h2>
                <p className="text-on-surface-variant">
                  Recevez nos meilleures pratiques, mises à jour produit et offres exclusives.
                </p>
              </div>
              <div className="flex w-full lg:w-auto gap-3">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="px-5 py-3 rounded-xl border border-outline-variant bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 w-full lg:w-80"
                />
                <button className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all whitespace-nowrap">
                  S'abonner
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 lg:px-12 border-t border-outline-variant/20 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="font-headline font-extrabold text-xl tracking-tight text-secondary">
              NovaSMS
            </span>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-secondary/60">
            <a href="#" className="hover:text-primary">
              Confidentialité
            </a>
            <a href="#" className="hover:text-primary">
              Conditions
            </a>
            <a href="#" className="hover:text-primary">
              Support
            </a>
          </div>
          <p className="text-sm text-secondary/40">© 2026 NovaSMS Inc.</p>
        </div>
      </footer>
    </div>
  );
}
