import { NotificationAdminPanel } from '@/components/admin/NotificationAdminPanel';
import { requireAdmin } from '@/lib/auth/server';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin - Notificações',
  description: 'Painel administrativo para gerenciar notificações push',
};

export default async function AdminNotificationsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin - Notificações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie notificações push, visualize estatísticas e envie mensagens para todos os usuários
        </p>
      </div>
      <NotificationAdminPanel />
    </div>
  );
}

