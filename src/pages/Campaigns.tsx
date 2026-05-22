import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DriverTour from '@/components/DriverTour';
import CampaignListDashboard from '@/components/campaigns/CampaignListDashboard';

const CampaignsPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tourRun, setTourRun] = useState(false);
  const startTourRequested = searchParams.get('tour') === '1';

  useEffect(() => {
    if (!startTourRequested) return;
    setTourRun(true);
    setSearchParams(
      (params) => {
        params.delete('tour');
        return params;
      },
      { replace: true },
    );
  }, [setSearchParams, startTourRequested]);

  return (
    <>
      <div className="px-8 pt-6 flex justify-end">
        <button
          onClick={() => setTourRun(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
        >
          Parcours création campagne
        </button>
      </div>
      <CampaignListDashboard />
      <DriverTour
        run={tourRun}
        onClose={() => setTourRun(false)}
        steps={[
          {
            element: '[data-tour="campaigns-new-campaign-button"]',
            popover: {
              title: 'Créer une campagne',
              description: 'Ce bouton ouvre le wizard pour créer une nouvelle campagne.',
              position: 'bottom',
            },
          },
          {
            element: '[data-tour="campaigns-create-campaign-button"]',
            popover: {
              title: 'Créer depuis la liste vide',
              description: 'Même action ici si vous n’avez encore aucune campagne.',
              position: 'bottom',
            },
          },
        ]}
      />
    </>
  );
};

export default CampaignsPage;
