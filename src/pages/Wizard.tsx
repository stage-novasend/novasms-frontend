import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

type WizardData = {
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  sector: string;
  contactsSource: string;
  primaryChannels: string[];
  campaignName: string;
  campaignGoal: string;
};

const steps = [
  { number: 1, title: 'Profil', description: 'Informations personnelles' },
  { number: 2, title: 'Contacts', description: 'Import et préparation' },
  { number: 3, title: 'Canaux', description: 'Choix de diffusion' },
  { number: 4, title: 'Campagne', description: 'Première campagne' },
];

const channelOptions = ['Email', 'SMS', 'WhatsApp', 'Push'];

export default function Wizard() {
  const navigate = useNavigate();
  const markOnboardingCompleted = useAuthStore((state) => state.markOnboardingCompleted);
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    fullName: '',
    email: '',
    companyName: '',
    role: 'Responsable Marketing',
    sector: 'E-commerce',
    contactsSource: 'CSV',
    primaryChannels: ['Email', 'SMS'],
    campaignName: '',
    campaignGoal: 'Promotion flash',
  });

  const goNext = () => {
    if (currentStep < 4) {
      setCurrentStep((step) => step + 1);
      return;
    }

    markOnboardingCompleted();
    navigate('/dashboard');
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
    }
  };

  const handleSkip = () => {
    markOnboardingCompleted();
    navigate('/dashboard');
  };

  const toggleChannel = (channel: string) => {
    setData((previous) => ({
      ...previous,
      primaryChannels: previous.primaryChannels.includes(channel)
        ? previous.primaryChannels.filter((item) => item !== channel)
        : [...previous.primaryChannels, channel],
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Nom complet
              </label>
              <input
                value={data.fullName}
                onChange={(event) => setData({ ...data, fullName: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Aminata Koné"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Email professionnel
              </label>
              <input
                type="email"
                value={data.email}
                onChange={(event) => setData({ ...data, email: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="aminata@novasms.ci"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Nom de la boutique
              </label>
              <input
                value={data.companyName}
                onChange={(event) => setData({ ...data, companyName: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Nova Shop Abidjan"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Rôle
              </label>
              <select
                value={data.role}
                onChange={(event) => setData({ ...data, role: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>Responsable Marketing</option>
                <option>Gérant de Boutique</option>
                <option>Administrateur Compte</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Secteur
              </label>
              <div className="flex flex-wrap gap-2">
                {['E-commerce', 'Immobilier', 'Services B2B', 'Luxe & Beauté'].map((sector) => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => setData({ ...data, sector })}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      data.sector === sector
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Source d'import
              </label>
              <div className="grid md:grid-cols-3 gap-3">
                {['CSV', 'XLSX', 'API / Formulaire'].map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setData({ ...data, contactsSource: source })}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      data.contactsSource === source
                        ? 'border-primary bg-brand-light text-brand-text'
                        : 'border-outline-variant bg-surface text-on-surface-variant'
                    }`}
                  >
                    <div className="font-semibold text-sm">{source}</div>
                    <div className="text-xs mt-1 opacity-70">Prévisualisation et déduplication</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                  Prévisualisation
                </p>
                <div className="space-y-2 text-sm text-on-surface">
                  <div className="flex justify-between">
                    <span>Nom</span>
                    <span>Extrait</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email</span>
                    <span>Extrait</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Téléphone</span>
                    <span>Extrait</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                  Règles d'import
                </p>
                <ul className="space-y-2 text-sm text-on-surface-variant list-disc pl-5">
                  <li>Jusqu'à 50 000 lignes par fichier</li>
                  <li>Déduplication automatique email + téléphone</li>
                  <li>Rapport succès / doublons / erreurs</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Canaux prioritaires
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {channelOptions.map((channel) => {
                  const active = data.primaryChannels.includes(channel);

                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`rounded-xl border px-4 py-4 text-left transition-all flex items-center justify-between ${
                        active
                          ? 'border-primary bg-brand-light text-brand-text'
                          : 'border-outline-variant bg-surface text-on-surface-variant'
                      }`}
                    >
                      <span className="font-semibold">{channel}</span>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${active ? 'border-primary bg-primary text-white' : 'border-outline-variant'}`}
                      >
                        {active ? <Check className="w-3 h-3" /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3">
                Aperçu de configuration
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-on-surface-variant">Rôle:</span> {data.role}
                </div>
                <div>
                  <span className="text-on-surface-variant">Secteur:</span> {data.sector}
                </div>
                <div>
                  <span className="text-on-surface-variant">Import:</span> {data.contactsSource}
                </div>
                <div>
                  <span className="text-on-surface-variant">Canaux:</span>{' '}
                  {data.primaryChannels.join(', ')}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Nom de la première campagne
              </label>
              <input
                value={data.campaignName}
                onChange={(event) => setData({ ...data, campaignName: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Bienvenue chez Nova Shop"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Objectif
              </label>
              <select
                value={data.campaignGoal}
                onChange={(event) => setData({ ...data, campaignGoal: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>Promotion flash</option>
                <option>Bienvenue nouveau client</option>
                <option>Relance panier abandonné</option>
                <option>Message transactionnel</option>
              </select>
            </div>

            <div className="rounded-xl bg-surface-container-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3">
                Résumé final
              </p>
              <div className="space-y-2 text-sm text-on-surface">
                <div>Nom: {data.fullName || 'À compléter'}</div>
                <div>Entreprise: {data.companyName || 'À compléter'}</div>
                <div>Canaux: {data.primaryChannels.join(', ')}</div>
                <div>Campagne: {data.campaignName || 'À compléter'}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(18,110,0,0.14),transparent_30%),linear-gradient(180deg,#f3fde9_0%,#edf7e3_100%)] text-on-surface">
      <header className="w-full px-8 py-6 flex justify-between items-center">
        <div className="text-xl font-black text-primary tracking-tighter">NovaSMS</div>
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Cloud className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            Toutes les modifications sont enregistrées
          </span>
        </div>
      </header>

      <main className="px-6 pb-20">
        <div className="mx-auto w-full max-w-6xl mt-6">
          <div className="grid grid-cols-4 gap-4 mb-10">
            {steps.map((step) => {
              const isActive = currentStep >= step.number;
              const isCurrent = currentStep === step.number;

              return (
                <div key={step.number} className="flex flex-col gap-3">
                  <div
                    className={`h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-surface-container-highest'}`}
                  ></div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm ${isCurrent ? 'text-primary' : 'text-on-surface-variant'}`}
                    >
                      {String(step.number).padStart(2, '0')}
                    </span>
                    <span
                      className={`text-xs uppercase tracking-[0.2em] ${isCurrent ? 'text-on-surface' : 'text-on-surface-variant'}`}
                    >
                      {step.title}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{step.description}</p>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-4 flex flex-col gap-4">
              <h1 className="text-5xl font-extrabold leading-tight tracking-tighter text-on-surface">
                L'architecte de votre identité.
              </h1>
              <p className="text-lg leading-relaxed text-on-surface-variant max-w-sm">
                Configurez votre espace de travail en 4 étapes pour préparer vos premières campagnes
                multicanales.
              </p>

              <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3">
                  RG-07 Protocol
                </p>
                <div className="space-y-3 text-sm text-on-surface-variant">
                  <div className="flex gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5" /> Profil marchand
                  </div>
                  <div className="flex gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5" /> Import des contacts
                  </div>
                  <div className="flex gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5" /> Sélection des canaux
                  </div>
                  <div className="flex gap-3">
                    <Check className="w-4 h-4 text-primary mt-0.5" /> Première campagne
                  </div>
                </div>
              </div>
            </aside>

            <section className="lg:col-span-8 rounded-3xl border border-outline-variant/30 bg-surface shadow-2xl p-8 lg:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-on-surface mb-2">
                  {steps[currentStep - 1].title}
                </h2>
                <p className="text-on-surface-variant">{steps[currentStep - 1].description}</p>
              </div>

              {renderStepContent()}

              <div className="mt-10 flex items-center justify-between gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={currentStep === 1}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface-variant font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-5 py-3 rounded-xl text-on-surface-variant font-semibold hover:bg-surface-container transition-colors"
                  >
                    Passer
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
                  >
                    {currentStep === 4 ? 'Terminer' : 'Suivant'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
