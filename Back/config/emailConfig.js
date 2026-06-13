const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Vérifier la configuration du transporteur
transporter.verify(function(error, success) {
  if (error) {
    console.log('Erreur de configuration du transporteur:', error);
  } else {
    console.log('Le serveur est prêt à envoyer des emails');
  }
});

module.exports = transporter; 