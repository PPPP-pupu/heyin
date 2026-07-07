import Link from "next/link";

interface SecondaryButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
}

export default function SecondaryButton({
  href,
  onClick,
  children,
  className = "",
  type = "button",
}: SecondaryButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl border border-indigo-300 bg-white px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition-colors w-full";

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={`${baseClasses} ${className}`}>
      {children}
    </button>
  );
}
