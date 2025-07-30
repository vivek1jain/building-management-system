
// This is the layout for /login, /signup, /pending-approval, /logged-out
// It does NOT include AppLayout.
export default function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <main className="w-full max-w-md">
        {children}
      </main>
    </div>
  );
}
