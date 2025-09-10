import {AppHeader} from '@/components/app-header';
import {Dashboard} from '@/components/dashboard';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        <Dashboard />
      </main>
    </div>
  );
}
