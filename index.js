// index.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Accredian-backend-task!');
});

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

app.post('/api/referral', [
  body('referrerName').notEmpty().withMessage('Referrer name is required'),
  body('referrerPhone').notEmpty().withMessage('Referrer phone is required').isNumeric().withMessage('Referrer phone must be numeric'),
  body('referrerEmail').notEmpty().withMessage('Referrer email is required').isEmail().withMessage('Referrer email is invalid'),
  body('refereeName').notEmpty().withMessage('Referee name is required'),
  body('refereePhone').notEmpty().withMessage('Referee phone is required').isNumeric().withMessage('Referee phone must be numeric'),
  body('refereeEmail').notEmpty().withMessage('Referee email is required').isEmail().withMessage('Referee email is invalid')
], async (req, res) => {

  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

  const { referrerName, referrerPhone, referrerEmail, refereeName, refereePhone, refereeEmail } = req.body; 

  try {
    const newReferral = await prisma.referral.create({
      data: {
        referrerName,
        referrerPhone,
        referrerEmail,
        refereeName,
        refereePhone,
        refereeEmail,
      },
    });

    // Send referral email
    const mailOptions = {
      from: process.env.EMAIL,
      to: refereeEmail,
      subject: 'Course Referral',
      text: `${referrerName} has referred you to a course.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send('Refered Successfully. Error sending email');
      }
      res.status(200).json({
        message: "Referred Successfully",
        referral: newReferral
      });
      
    });
  } catch (error) {
    res.status(500).json({ error: error + 'An error occurred' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
