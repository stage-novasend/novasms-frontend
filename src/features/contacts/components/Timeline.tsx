type Event = {
  id: string;
  type: string;
  message?: string;
  createdAt: string;
};

export default function Timeline({ events }: { events?: Event[] }) {
  if (!events || events.length === 0) return <div className="text-sm text-on-surface-variant">Aucun historique.</div>;

  return (
    <div className="space-y-3">
      {events.map(ev => (
        <div key={ev.id} className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
          <div>
            <div className="text-sm font-medium">{ev.type}</div>
            <div className="text-sm text-on-surface-variant">{ev.message}</div>
            <div className="text-xs text-on-surface-variant mt-1">{new Date(ev.createdAt).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
