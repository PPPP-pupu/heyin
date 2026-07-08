import AppShell from "@/components/common/AppShell";
import AppHeader from "@/components/common/AppHeader";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";
import TemporaryAccessWarning from "@/components/common/TemporaryAccessWarning";

export default function HomePage() {
  return (
    <AppShell>
      <AppHeader />

      {/* Hero section */}
      <section className="flex flex-col items-center px-6 pt-16 pb-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
          <span className="text-3xl">🎵</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Heyin</h1>
        <p className="mt-1 text-xl font-medium text-indigo-500">和音</p>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Sing together. Keep every voice.
        </p>
      </section>

      {/* Actions */}
      <section className="flex flex-col gap-3 px-6 pb-12">
        <TemporaryAccessWarning />
        <PrimaryButton href="/create">Create Chorus Project</PrimaryButton>
        <SecondaryButton href="/explore">Explore Projects</SecondaryButton>
      </section>
    </AppShell>
  );
}
