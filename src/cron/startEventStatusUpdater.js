import cron from 'node-cron'
import Event from '../modules/events/event.model.js'

export function startEventStatusUpdater() {
  console.log('[CRON] Event status updater started')

  // Chạy mỗi 10 phút
  cron.schedule('*/10 * * * *', async () => {
    try {
      const now = new Date()
      const updated = await Event.updateMany(
        {
          endDate: { $lt: now },
          isActive: true,
        },
        { isActive: false },
      )

      if (updated.modifiedCount > 0) {
        console.log(`[CRON] Deactivated ${updated.modifiedCount} expired events`)
      }
    } catch (err) {
      console.error('[CRON] Error updating event status:', err.message)
    }
  })
}
