interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export default function AppShell({ children, className = "" }: AppShellProps) {
  return (
    <div className={`mx-auto w-full max-w-lg flex-1 bg-white min-h-screen ${className}`}>
      {children}
    </div>
  );
}
