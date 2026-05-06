import { Check, X } from 'lucide-react';

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: '8 caractères min.', test: password.length >= 8 },
    { label: '1 majuscule', test: /[A-Z]/.test(password) },
    { label: '1 chiffre', test: /[0-9]/.test(password) },
    { label: '1 caractère spécial', test: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.test).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-primary'];
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort'];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 h-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-surface-variant'}`}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-on-surface-variant">
        Force :{' '}
        <span
          className={score >= 4 ? 'text-primary' : score >= 2 ? 'text-yellow-600' : 'text-red-600'}
        >
          {labels[score - 1] || 'Très faible'}
        </span>
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-on-surface-variant/70">
        {checks.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {c.test ? (
              <Check className="w-3.5 h-3.5 text-primary" />
            ) : (
              <X className="w-3.5 h-3.5 text-red-500" />
            )}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
