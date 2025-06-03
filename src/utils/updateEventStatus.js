import dayjs from 'dayjs'
import Event from '../modules/events/event.model.js'

let running = false

export async function updateEventStatus() {
  if (running) return
  running = true
  try {
    console.log(`[${dayjs().format()}] 🔄 Checking for expired events...`)
    const now = new Date()
    const updated = await Event.updateMany(
      { endDate: { $lt: now }, isActive: true },
      { isActive: false },
    )
    if (updated.modifiedCount > 0) {
      console.log(`✅ Deactivated ${updated.modifiedCount} expired events`)
    } else {
      console.log('ℹ️ No expired active events found')
    }
  } catch (err) {
    console.error('❌ Error updating event status:', err.message)
  } finally {
    running = false
  }
}
