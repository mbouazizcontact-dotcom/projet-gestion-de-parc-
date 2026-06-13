const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
const reclamationRoutes = require('./routes/ReclamationRoutes');
const pieceRoutes = require('./routes/pieceRoutes');
const demandeRoutes = require('./routes/demandePieceRoutes');
const mecaniciensRoutes = require('./routes/mecanicienRoutes');
const stat = require('./routes/statistiquesTech');
const vehiculeRoutes = require('./routes/vehiculeRoutes');
const chauffeurRoutes = require('./routes/chauffeurRoutes');
const groupeRoutes = require('./routes/groupeRoutes');
const garageRoutes = require('./routes/garageRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes'); 
const repairInterventionRoutes = require('./routes/RepairInterventionRoutes'); 
const typeMaintenanceRoutes = require('./routes/typeMaintenanceRoutes'); 
const alerteRoutes = require('./routes/alerteRoutes');
const receptionFicheRoutes = require('./routes/ReceptionFicheRoutes');
const carburantRoutes = require('./routes/carburantRoutes');
const notificationRoutes = require('./routes/notificationRoutes');










dotenv.config();

const app = express();

connectDB();

// CORS Configuration
app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origine (comme les applications mobiles ou curl)
    if (!origin) return callback(null, true);
    
    // Autoriser tous les localhosts avec n'importe quel port
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }
    
    callback(new Error('Non autorisé par CORS'));
  },
  methods: ['GET', 'POST', 'PATCH','PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Autoriser les cookies
}));

// Middleware pour analyser les données JSON
app.use(express.json());

// Routes
app.use('/api/carburant', carburantRoutes);

app.use('/api/groupes', groupeRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/api/users', userRoutes);
app.use('/api/reclamations', reclamationRoutes);
app.use('/api/pieces', pieceRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api', chauffeurRoutes); // Changed to /api for consistency
app.use('/api/vehicules', vehiculeRoutes);
app.use('/api/mecaniciens', mecaniciensRoutes);
// app.use('/api', demandeMaintenance);
app.use('/api',stat);
app.use('/api/garages', garageRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/repair-interventions', repairInterventionRoutes);
app.use('/api/maintenance', typeMaintenanceRoutes);
app.use('/api/alertes', alerteRoutes);
app.use('/api/reception-fiches', receptionFicheRoutes);
app.use('/api/notifications', notificationRoutes);






// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
