import { dbDelete } from '@/lib/storage/db';

(window as any).__e2e = {
  deleteAllScenarios: () => dbDelete('scenarios'),
};
