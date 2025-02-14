import { PrismaClient } from '@prisma/client';
import emailService from '../services/emailService.js';

const prisma = new PrismaClient();

export const createReferral = async (req, res) => {
  try {
    const { referrerName, referrerEmail, friendName, friendEmail, courseName } = req.body;

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerName,
        referrerEmail,
        friendName,
        friendEmail,
        courseName,
        status: 'PENDING',
        emailSent: false
      }
    });

    // Send email
    try {
      await emailService.sendReferralEmail(referral);
      
      // Update referral status after successful email send
      await prisma.referral.update({
        where: { id: referral.id },
        data: { emailSent: true }
      });
    } catch (emailError) {
      console.error('Failed to send referral email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Referral created successfully',
      referral
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
