export function CountrySelect({ 
  value, 
  onChange, 
  error 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
  error?: string 
}) {
  return (
    <div>
      <select 
        value={value} 
        onChange={onChange}
        className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      >
        <option value="CI">Côte d'Ivoire</option>
        <option value="SN">Sénégal</option>
        <option value="ML">Mali</option>
        <option value="BF">Burkina Faso</option>
        <option value="FR">France</option>
      </select>
      {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
