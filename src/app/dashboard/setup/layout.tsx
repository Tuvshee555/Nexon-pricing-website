// Full-screen overlay that covers the dashboard sidebar during onboarding
export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {children}
    </div>
  );
}
