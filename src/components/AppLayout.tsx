import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import OnboardingTour from './OnboardingTour';
import { useUiStore } from '@/stores/uiStore';

export default function AppLayout() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile overlay backdrop */}
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <OnboardingTour />
    </div>
  );
}
