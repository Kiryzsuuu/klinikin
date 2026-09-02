export default function SectionTitle({
  eyebrow,
  title,
  subtitle,
  light,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <div className="text-center max-w-xl mx-auto mb-14">
      {eyebrow && (
        <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${light ? "text-white/70" : "text-green"}`}>{eyebrow}</p>
      )}
      <h2 className={`text-3xl font-bold mb-4 pb-5 relative inline-block ${light ? "text-white" : "text-dark"}`}>
        {title}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-green" />
      </h2>
      {subtitle && <p className={light ? "text-white/70" : "text-dark/60"}>{subtitle}</p>}
    </div>
  );
}
