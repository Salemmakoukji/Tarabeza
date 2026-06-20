export default function Logo({ className = 'h-8', variant = 'white' }) {
  const src = variant === 'color' ? '/Logo - Color.png' : '/Logo - White.png';
  return (
    <img 
      src={src} 
      alt="Tarapeza Logo" 
      className={`h-8 w-auto object-contain ${className}`}
    />
  );
}
