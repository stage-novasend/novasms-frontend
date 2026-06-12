type IconProps = { size?: number; className?: string };

function LogoImg({ src, alt, size }: { src: string; alt: string; size: number }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ objectFit: 'contain', borderRadius: 8, display: 'block' }}
      draggable={false}
    />
  );
}

export function WaveIcon({ size = 32 }: IconProps) {
  return (
    <LogoImg
      src="https://play-lh.googleusercontent.com/Ww3DM3gzdtQM-NW_fvF_T3Qx9b3ibO_xS6me6N1zr3kV3nwqtkLNiTZ9mPuNU76mFYIxapl2jF5sJRaTQy_GbQ"
      alt="Wave"
      size={size}
    />
  );
}

export function OrangeMoneyIcon({ size = 32 }: IconProps) {
  return (
    <LogoImg
      src="https://logos-marques.com/wp-content/uploads/2021/02/logo-Orange-SA.jpg"
      alt="Orange Money"
      size={size}
    />
  );
}

export function MomoIcon({ size = 32 }: IconProps) {
  return (
    <LogoImg
      src="https://upload.wikimedia.org/wikipedia/fr/thumb/e/e9/Mtn-logo-svg.svg/1280px-Mtn-logo-svg.svg.png"
      alt="MTN MoMo"
      size={size}
    />
  );
}

export function MoovIcon({ size = 32 }: IconProps) {
  return <LogoImg src="/assets/moov-logo.png" alt="Moov Money" size={size} />;
}

export function NovaSendIcon({ size = 32 }: IconProps) {
  return <LogoImg src="/assets/novasend-logo.png" alt="NovaSend" size={size} />;
}

export function VisaIcon({ size = 32, className }: IconProps) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.63)}
      viewBox="0 0 78 50"
      fill="none"
      className={className}
    >
      <rect width="78" height="50" rx="7" fill="#1a1f71" />
      <text
        x="39"
        y="34"
        textAnchor="middle"
        fill="white"
        fontSize="22"
        fontWeight="900"
        fontFamily="Arial"
        letterSpacing="-1"
        fontStyle="italic"
      >
        VISA
      </text>
    </svg>
  );
}

export function StripeIcon({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="#635bff" />
      <path
        d="M22 18c0-1.5 1.2-2.4 3-2.4 2.6 0 5.1 1 6.9 2.5l1.5-4.5C31.6 12.3 28.6 11 25 11c-5.2 0-8.8 2.8-8.8 7.2 0 7.8 10.6 5.8 10.6 9.8 0 1.6-1.4 2.5-3.4 2.5-2.8 0-5.6-1.2-7.6-3l-1.6 4.5C16.2 34.3 19.7 36 24 36c5.5 0 9.2-2.8 9.2-7.3C33.2 20.4 22 22.3 22 18z"
        fill="white"
      />
    </svg>
  );
}

export function SimulationBadgeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="#7c3aed" />
      <path
        d="M4 7l1.5 1.5L10 5"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
