import { DatabaseProvider as WatermelonProvider } from '@nozbe/watermelondb/react';
import { database } from '../db';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return <WatermelonProvider database={database}>{children}</WatermelonProvider>;
}
