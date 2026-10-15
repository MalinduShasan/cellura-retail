import { CustomerManager } from '@/components/admin/customer-manager';

export const metadata = {
  title: 'Customer Profiles & Password Control | Cellura Admin',
  description: 'Manage registered customer profiles, default shipping addresses, and account credentials.',
};

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <CustomerManager />
    </div>
  );
}
