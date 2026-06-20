export default function UserAvatar({ user, profile, className = "h-9 w-9" }) {
  // Priority 1: Google profile picture
  const googlePic = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  
  // Priority 2: Restaurant logo
  const logoPic = profile?.logo_url;

  // Priority 3: Fallback initials
  const fullName = user?.user_metadata?.full_name || profile?.name || user?.email || 'U';
  const initial = fullName.charAt(0).toUpperCase();

  // Curated premium background colors for initial fallbacks
  const bgColors = [
    'bg-[#f97316]', // Orange
    'bg-[#ef4444]', // Red
    'bg-[#8b5cf6]', // Purple
    'bg-[#3b82f6]', // Blue
    'bg-[#22c55e]', // Green
    'bg-[#ec4899]', // Pink
    'bg-[#f59e0b]', // Amber
    'bg-[#14b8a6]', // Teal
  ];

  // Deterministic hashing helper to return a consistent background color per user
  const getBgColor = (text) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % bgColors.length;
    return bgColors[idx];
  };

  const bgColorClass = getBgColor(fullName);

  if (googlePic) {
    return (
      <img
        src={googlePic}
        alt={fullName}
        className={`${className} rounded-full object-cover border border-slate-800 shadow-inner`}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (logoPic) {
    return (
      <img
        src={logoPic}
        alt={profile?.name || fullName}
        className={`${className} rounded-full object-cover border border-slate-800 shadow-inner`}
      />
    );
  }

  return (
    <div className={`${className} rounded-full flex items-center justify-center text-white font-extrabold text-xs uppercase tracking-tight border border-slate-850/30 shadow-inner ${bgColorClass}`}>
      {initial}
    </div>
  );
}
