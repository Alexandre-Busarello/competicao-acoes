import { SessionValidator } from '@/components/auth/SessionValidator';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <SessionValidator />
      {children}
    </div>
  );
}

