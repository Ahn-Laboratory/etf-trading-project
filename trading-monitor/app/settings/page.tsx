'use client';

import { ServiceHealth } from '@/components/settings/service-health';
import { ConfigDisplay } from '@/components/settings/config-display';
import { generateDummyConfig } from '@/lib/dummy-data';

export default function SettingsPage() {
  const config = generateDummyConfig();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ServiceHealth />
        <ConfigDisplay config={config} />
      </div>
    </div>
  );
}
