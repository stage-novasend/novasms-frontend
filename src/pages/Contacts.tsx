import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContactTable from '@/features/contacts/components/ContactTable';
import ImportModal from '@/features/contacts/components/ImportModal';

export default function ContactsPage() {
  const navigate = useNavigate();
  const [isImportOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportClick = () => setImportOpen(true);
  const handleImportClose = () => setImportOpen(false);

  const handleImportComplete = () => {
    setRefreshKey((prev) => prev + 1);
    setImportOpen(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Contacts</h1>
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
    </div>
  );
}
