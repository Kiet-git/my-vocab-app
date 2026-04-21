export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center px-4 py-16">
      {children}
    </div>
  );
}
