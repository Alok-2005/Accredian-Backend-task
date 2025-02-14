import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createReferral } from './controllers/referralControllers.js';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// // Mailtrap transporter setup
// const transporter = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: process.env.MAILTRAP_USER,
//     pass: process.env.MAILTRAP_PASS
//   }
// });

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Signup route
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET);
    res.json({ accessToken });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET);
    res.json({ accessToken });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Referral API endpoint
// app.post('/api/referrals', authenticateToken, async (req, res) => {
//   try {
//     const {
//       referrerName,
//       referrerEmail,
//       friendName,
//       friendEmail,
//       courseName
//     } = req.body;

//     if (!referrerName || !referrerEmail || !friendName || !friendEmail || !courseName) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }

//     const referral = await prisma.referral.create({
//       data: {
//         referrerName,
//         referrerEmail,
//         friendName,
//         friendEmail,
//         courseName,
//         status: 'PENDING'
//       }
//     });

//     const mailOptions = {
//       from: '"Refer & Earn Program" <referral@yourdomain.com>',
//       to: friendEmail,
//       subject: `${referrerName} has referred you to our ${courseName} course!`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h1 style="color: #2563eb;">Hello ${friendName}!</h1>
//           <p>${referrerName} thinks you'd be interested in our ${courseName} course.</p>
//           <p>Here's what you'll get:</p>
//           <ul>
//             <li>Access to premium course content</li>
//             <li>One-on-one mentoring sessions</li>
//             <li>Certificate upon completion</li>
//           </ul>
//           <div style="margin: 30px 0;">
//             <a href="${process.env.WEBSITE_URL}/courses/${courseName}" 
//                style="background-color: #2563eb; color: white; padding: 12px 24px; 
//                       text-decoration: none; border-radius: 5px; display: inline-block;">
//               View Course Details
//             </a>
//           </div>
//           <p style="color: #666; font-size: 14px;">
//             This referral was sent through our Refer & Earn program. 
//             If you believe this was sent in error, please ignore this email.
//           </p>
//         </div>
//       `
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(201).json({
//       message: 'Referral created successfully',
//       referral
//     });
//   } catch (error) {
//     console.error('Error creating referral:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

app.post('/api/referrals', authenticateToken, createReferral);
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await prisma.$connect();
  console.log(`Server running on port ${PORT}`);
});