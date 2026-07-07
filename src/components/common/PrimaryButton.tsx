import Link from "next/link";

interface PrimaryButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

export default function PrimaryButton({
  href,
  onClick,
  children,
  className = "",
  type = "button",
  disabled = false,
}: PrimaryButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 active:bg-indigo-700 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed";

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${className}`}>
      {children}
    </button>
  );
}
