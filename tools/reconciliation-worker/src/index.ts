import axios from 'axios';
import { ReconciliationService } from '@medi-aide/migration-tools';

const reconciliation = new ReconciliationService();

async function run() {
  const monolithBase = process.env.MONOLITH_BASE || 'http://localhost:3000';
  const microBase = process.env.MICRO_BASE || 'http://localhost:4010'; // notification-service default
  const id = process.env.NOTIFICATION_ID;
  if (!id) {
    console.error('Set NOTIFICATION_ID to reconcile');
    process.exit(1);
  }

  const outcome = await reconciliation.reconcile(
    id,
    async () => {
      const r = await axios.get(`${monolithBase.replace(/\/$/, '')}/api/v1/notifications/${id}`);
      return r.data;
    },
    async () => {
      const r = await axios.get(`${microBase.replace(/\/$/, '')}/notifications/${id}`);
      return r.data;
    },
    async ({ source, value }) => {
      if (source === 'micro') {
        // Write back to monolith
        await axios.post(`${monolithBase.replace(/\/$/, '')}/api/v1/notifications/shadow`, value);
      } else {
        // Write to micro
        await axios.post(`${microBase.replace(/\/$/, '')}/notifications`, value);
      }
    }
  );

  console.log(`Reconciliation outcome: ${outcome}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});



