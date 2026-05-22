import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ContactTable from '@/features/contacts/components/ContactTable';
import ImportModal from '@/features/contacts/components/ImportModal';
import DriverTour from '@/components/DriverTour';

export default function ContactsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isImportOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tourRun, setTourRun] = useState(false);

  const startTourRequested = searchParams.get('tour') === '1';

  useEffect(() => {
    if (!startTourRequested) return;
    setImportOpen(true);
    setTourRun(true);
    setSearchParams(
      (params) => {
        params.delete('tour');
        return params;
      },
      { replace: true },
    );
  }, [setSearchParams, startTourRequested]);

  const handleImportClick = () => setImportOpen(true);
  const handleImportClose = () => setImportOpen(false);

  const handleImportComplete = () => {
    setRefreshKey((prev) => prev + 1);
    setImportOpen(false);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <button
          onClick={() => {
            setImportOpen(true);
            setTourRun(true);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
        >
          Parcours import & segments
        </button>
      </div>
      <ContactTable
        key={refreshKey}
        onImportClick={handleImportClick}
        onContactClick={(contact) => navigate(`/contacts/${contact.id}`)}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={handleImportClose}
        onImportComplete={handleImportComplete}
      />

      <DriverTour
        run={tourRun}
        onClose={() => {
          setTourRun(false);
          if (startTourRequested || tourRun) {
            navigate('/campaigns?tour=1');
          }
        }}
        steps={[
          {
            element: '[data-tour="contacts-import-button"]',
            popover: {
              title: 'Importer les contacts',
              description: 'Cliquez ici pour importer un fichier CSV/XLS et alimenter votre base.',
              position: 'right',
            },
          },
          {
            element: '[data-tour="contacts-upload-file-button"]',
            popover: {
              title: 'Sélectionner le fichier',
              description:
                'Dans cette fenêtre, choisissez votre CSV pour passer à la cartographie des colonnes.',
              position: 'left',
            },
          },
          {
            element: '[data-tour="contacts-new-segment-button"]',
            popover: {
              title: 'Créer un segment',
              description:
                'Après l’import, créez un segment pour filtrer vos contacts avant la campagne.',
              position: 'right',
            },
          },
          {
            element: '[data-tour="contacts-save-segment-button"]',
            popover: {
              title: 'Sauvegarder le segment',
              description: 'Enregistrez la règle pour la réutiliser dans vos prochaines campagnes.',
              position: 'right',
            },
          },
        ]}
      />
    </div>
  );
}
