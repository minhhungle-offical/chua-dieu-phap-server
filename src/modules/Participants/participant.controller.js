import { generateSecureOTP } from '../../utils/generateSecureOTP.js'
import { sendOtpEmail } from '../../utils/sendOtpEmail.js'
import { sendQrEmail } from '../../utils/sendQREmail.js'
import Event from '../events/event.model.js'
import Participant from './participants.model.js'

/**
 * Create a new participant.
 * - Requires: name, event, hasAgreed
 * - If robeOption is 'borrow' or 'buy' → robeSize is required
 * - If email is provided → generate OTP and send verification email
 * - If no email → participant is created with 'pending' status
 */
export const createParticipant = async (req, res) => {
  try {
    const data = req.body

    // 1. Validate required fields
    if (!data.name || !data.event) {
      return res.status(400).json({ message: 'Name and event are required.' })
    }

    if (['borrow', 'buy'].includes(data.robeOption) && !data.robeSize) {
      return res.status(400).json({ message: 'Robe size is required for borrow/buy option.' })
    } else if (!['borrow', 'buy'].includes(data.robeOption)) {
      data.robeSize = null
    }

    // 2. Check if event exists
    const selectedEvent = await Event.findById(data.event)
    if (!selectedEvent) {
      return res.status(404).json({ message: 'Event not found.' })
    }

    // 3. Check participant limit
    const currentCount = await Participant.countDocuments({
      event: data.event,
      isActive: true,
      status: { $in: ['pending', 'confirmed'] },
    })

    if (selectedEvent.capacity && currentCount >= selectedEvent.capacity) {
      return res.status(400).json({ message: 'Event has reached maximum participants.' })
    }

    // 4. Check if participant has joined other events before
    let hasParticipatedBefore = false
    if (data.email || data.phoneNumber) {
      const existed = await Participant.findOne({
        $or: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
        event: { $ne: data.event },
        isActive: true,
      })
      hasParticipatedBefore = !!existed
    }
    data.isFirstTime = !hasParticipatedBefore

    // 5. Ensure participant agrees to terms
    if (!data.hasAgreed) {
      return res.status(400).json({ message: 'You must agree to participate in the event.' })
    }

    data.status = 'pending'

    // 6. Email provided → generate OTP
    if (data.email) {
      const otp = generateSecureOTP(6)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
      data.otp = otp
      data.expiresAt = expiresAt

      const participant = await Participant.create(data)
      await sendOtpEmail(data.email, otp)

      return res.status(200).json({
        message: 'Registration successful! OTP has been sent to your email.',
        participantId: participant._id,
      })
    }

    // 7. No email → create participant in 'pending' status
    data.otp = null
    data.expiresAt = null
    const participant = await Participant.create(data)

    return res.status(201).json({
      message: 'Registration successful! Awaiting organizer approval.',
      participant,
    })
  } catch (error) {
    console.error('Error creating participant:', error)
    return res.status(500).json({ message: 'Server error.', error: error.message })
  }
}

/**
 * Verify OTP from email.
 * - Check if OTP is correct and valid
 * - If event requires payment → mark email verified but do not confirm
 * - If participant limit reached → deny
 * - If valid → confirm participant and send QR code
 */
export const verifyOtp = async (req, res) => {
  try {
    const { participantId, otpInput } = req.body

    if (!participantId || !otpInput) {
      return res.status(400).json({ message: 'Missing participantId or OTP.' })
    }

    const participant = await Participant.findById(participantId).populate('event')
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' })
    }

    const event = participant.event
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' })
    }

    if (!participant.otp || !participant.expiresAt) {
      return res.status(400).json({ message: 'No valid OTP found.' })
    }

    if (participant.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired.' })
    }

    if (participant.otp !== otpInput) {
      return res.status(400).json({ message: 'Incorrect OTP.' })
    }

    if (event.price > 0) {
      participant.isEmailVerified = true
      participant.otp = null
      participant.expiresAt = null
      await participant.save()

      return res.status(200).json({
        message: 'Email verified. Please complete payment to confirm registration.',
        participant,
      })
    }

    const confirmedCount = await Participant.countDocuments({
      event: event._id,
      status: 'confirmed',
      isActive: true,
    })

    if (event.maxParticipants && confirmedCount >= event.maxParticipants) {
      return res.status(400).json({
        message: 'Event has reached maximum capacity. You cannot register.',
      })
    }

    participant.status = 'confirmed'
    participant.isEmailVerified = true
    participant.otp = null
    participant.expiresAt = null
    await participant.save()

    if (participant.email) {
      await sendQrEmail(participant.email, participant)
    }

    return res.status(200).json({
      message: 'Verification successful. You are registered for the event.',
      participant,
    })
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return res.status(500).json({ message: 'Server error.', error: error.message })
  }
}

/**
 * Admin approves a participant (for events with fee or no email).
 * - Updates status to 'confirmed'
 * - Sends QR code if email is provided
 */
export const approveParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findById(id)
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' })
    }

    participant.status = 'confirmed'
    participant.otp = null
    participant.expiresAt = null
    await participant.save()

    if (participant.email) {
      await sendQrEmail(participant.email, participant)
    }

    return res.json({ message: 'Participant approved successfully.', participant })
  } catch (error) {
    console.error('Error approving participant:', error)
    return res.status(500).json({ message: 'Server error.', error: error.message })
  }
}

/**
 * Check-in participant on arrival.
 * - Sets isCheckedIn = true and saves timestamp
 */
export const checkInParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findByIdAndUpdate(
      id,
      { isCheckedIn: true, checkedInAt: new Date() },
      { new: true },
    )

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' })
    }

    return res.json({ message: 'Check-in successful.', participant })
  } catch (error) {
    console.error('Error checking in participant:', error)
    return res.status(500).json({ message: 'Server error.', error: error.message })
  }
}

/**
 * Update participant information.
 * - If email is changed, reset status to 'pending'
 */
export const updateParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    const participant = await Participant.findById(id)
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' })
    }

    if (data.email && data.email !== participant.email) {
      data.status = 'pending'
    }

    const updated = await Participant.findByIdAndUpdate(id, data, { new: true })
    return res.json({ message: 'Update successful.', participant: updated })
  } catch (error) {
    console.error('Error updating participant:', error)
    return res.status(500).json({ message: 'Server error.', error: error.message })
  }
}

/**
 * Soft delete a participant (mark as inactive).
 */
export const deleteParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findByIdAndUpdate(id, { isActive: false }, { new: true })
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' })
    }
    return res.json({ message: 'Participant deleted successfully.' })
  } catch (error) {
    console.error('Error deleting participant:', error)
    return res.status(500).json({ message: 'Server error.', error: error.message })
  }
}

/**
 * Reactivate a soft-deleted participant.
 */
export const activateParticipant = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findByIdAndUpdate(id, { isActive: true }, { new: true })
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' })
    }
    return res.json({ message: 'Participant reactivated successfully.', participant })
  } catch (error) {
    console.error('Error reactivating participant:', error)
    return res.status(500).json({ message: 'Server error.', error: error.message })
  }
}

/**
 * Get participants list with filters (event, status) and pagination.
 * - Returns data + meta: total, page, limit
 */
export const getParticipants = async (req, res) => {
  try {
    const { event, status, page = 1, limit = 10 } = req.query
    const query = { isActive: true }
    if (event) query.event = event
    if (status) query.status = status

    const skip = (page - 1) * limit
    const total = await Participant.countDocuments(query)
    const data = await Participant.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate('event', 'name date')

    return res.json({ meta: { total, page: Number(page), limit: Number(limit) }, data })
  } catch (error) {
    console.error('Error getting participants:', error)
    return res.status(500).json({ message: 'Server error.', error: error.message })
  }
}

/**
 * Get participant details by ID (populated with event).
 */
export const getParticipantById = async (req, res) => {
  try {
    const { id } = req.params
    const participant = await Participant.findById(id).populate('event', 'name date')
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found.' })
    }
    return res.json(participant)
  } catch (error) {
    console.error('Error getting participant details:', error)
    return res.status(500).json({ message: 'Server error.', error: error.message })
  }
}
