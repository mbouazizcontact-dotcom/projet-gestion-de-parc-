const mongoose = require('mongoose');
const Alerte = require('./Alerte'); // Import Alerte model (ensure no circular dependency with Alerte.js)

const vehiculeSchema = new mongoose.Schema({
  numero: { type: Number, required: true }, // Add this field
  marque: { type: String, required: true, trim: true },
  modele: { type: String, required: true, trim: true },
  immatriculation: { type: String, required: true, unique: true, trim: true },
  mec: { type: Date, required: true },
  age: { type: Number, default: 0 },
  etat: {
    type: String,
    enum: ['Fonctionnel', 'Reparation', 'Accidenté', 'stock'],
    default: 'Fonctionnel',
  },
  proprietaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groupe',
    required: true,
  },
  numChassis: { type: String, required: true, unique: true, trim: true },
  typeMines: { type: String, trim: true },
  kilometrage: {
    type: Number,
    required: true,
    min: [0, 'Le kilométrage doit être positif'],
  },
  lastMaintenanceKm: {
    type: Number,
    default: 0, // Kilométrage utilisé pour la dernière alerte de maintenance
  },
  conducteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
  },
  documentUrl: { type: String },
});

// Calculate age before save
vehiculeSchema.pre('save', function (next) {
  const today = new Date();
  const dateMec = this.mec;
  this.age = today.getFullYear() - dateMec.getFullYear();
  const monthDiff = today.getMonth() - dateMec.getMonth();
  const dayDiff = today.getDate() - dateMec.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    this.age--;
  }
  next();
});

// Function to generate alerts for a vehicle
const generateAlertsForVehicle = async (vehicleId) => {
  try {
    const vehicle = await mongoose.model('Vehicule')
      .findById(vehicleId)
      .populate('proprietaire', 'nom')
      .populate('conducteur', 'nom prenom');

    if (!vehicle) {
      throw new Error('Véhicule non trouvé');
    }

    const today = new Date();
    const alertsToInsert = [];

    const km = Number(vehicle.kilometrage) || 0;
    const lastMaintenanceKm = Number(vehicle.lastMaintenanceKm) || 0;

    // Calculate distances since last maintenance for various checks
    const kmSinceLastVidange = km - lastMaintenanceKm;
    const kmSinceLastBrakePads = km - lastMaintenanceKm;
    const kmSinceLastSparkPlugs = km - lastMaintenanceKm;
    const kmSinceLastExhaustCheck = km - lastMaintenanceKm;
    const kmSinceLastGearboxOil = km - lastMaintenanceKm;
    const kmSinceLastTireCheck = km - lastMaintenanceKm;

    // Vidange moteur : tous les 10 000 km par rapport au dernier kilométrage de maintenance
    if (kmSinceLastVidange >= 10000) {
      alertsToInsert.push({
        vehicleId: vehicle._id,
        message: `Vidange moteur à effectuer - ${kmSinceLastVidange} km depuis la dernière vidange`,
        urgency: kmSinceLastVidange >= 15000 ? 'Urgente' : 'Moyenne',
        status: 'Nouvelle',
        date: new Date(),
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
      });
    }

    // Changement des plaquettes de frein : tous les 30 000 km par rapport au dernier kilométrage de maintenance
    if (kmSinceLastBrakePads >= 30000) {
      alertsToInsert.push({
        vehicleId: vehicle._id,
        message: `Changement des plaquettes de frein à effectuer - ${kmSinceLastBrakePads} km depuis le dernier changement`,
        urgency: kmSinceLastBrakePads >= 35000 ? 'Urgente' : 'Moyenne',
        status: 'Nouvelle',
        date: new Date(),
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      });
    }

    // Remplacement des bougies (essence) : tous les 40 000 km
    if (kmSinceLastSparkPlugs >= 40000) {
      alertsToInsert.push({
        vehicleId: vehicle._id,
        message: `Remplacement des bougies à effectuer - ${kmSinceLastSparkPlugs} km depuis le dernier remplacement`,
        urgency: kmSinceLastSparkPlugs >= 45000 ? 'Urgente' : 'Moyenne',
        status: 'Nouvelle',
        date: new Date(),
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      });
    }

    // Contrôle échappement, rotules, suspension : tous les 40 000 km
    if (kmSinceLastExhaustCheck >= 40000) {
      alertsToInsert.push({
        vehicleId: vehicle._id,
        message: `Contrôle échappement, rotules, suspension à effectuer - ${kmSinceLastExhaustCheck} km depuis le dernier contrôle`,
        urgency: kmSinceLastExhaustCheck >= 45000 ? 'Urgente' : 'Moyenne',
        status: 'Nouvelle',
        date: new Date(),
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      });
    }

    // Vidange boîte de vitesses : tous les 40 000 km
    if (kmSinceLastGearboxOil >= 40000) {
      alertsToInsert.push({
        vehicleId: vehicle._id,
        message: `Vidange boîte de vitesses à effectuer - ${kmSinceLastGearboxOil} km depuis la dernière vidange`,
        urgency: kmSinceLastGearboxOil >= 45000 ? 'Urgente' : 'Moyenne',
        status: 'Nouvelle',
        date: new Date(),
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      });
    }

    // Vérification pression et usure des pneus : tous les 5 000 km
    if (kmSinceLastTireCheck >= 5000) {
      alertsToInsert.push({
        vehicleId: vehicle._id,
        message: `Vérification pression et usure des pneus à effectuer - ${kmSinceLastTireCheck} km depuis la dernière vérification`,
        urgency: kmSinceLastTireCheck >= 7500 ? 'Moyenne' : 'Faible',
        status: 'Nouvelle',
        date: new Date(),
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
      });
    }

    // Mise à jour du lastMaintenanceKm si une alerte de maintenance est générée
    if (
      kmSinceLastVidange >= 10000 ||
      kmSinceLastBrakePads >= 30000 ||
      kmSinceLastSparkPlugs >= 40000 ||
      kmSinceLastExhaustCheck >= 40000 ||
      kmSinceLastGearboxOil >= 40000 ||
      kmSinceLastTireCheck >= 5000
    ) {
      await mongoose.model('Vehicule').findByIdAndUpdate(vehicle._id, { lastMaintenanceKm: km });
    }

    if (alertsToInsert.length > 0) {
      await Alerte.insertMany(alertsToInsert);
    }

    return alertsToInsert;
  } catch (error) {
    console.error('Erreur dans generateAlertsForVehicle:', error);
    throw error;
  }
};

// Update group counts and generate alerts after save
vehiculeSchema.post('save', async function (doc) {
  const groupe = await mongoose.model('Groupe').findById(doc.proprietaire);
  if (groupe) {
    await groupe.updateCounts();
  }
  // Générer des alertes après la création
  await generateAlertsForVehicle(doc._id);
});

// Update group counts and generate alerts after update
vehiculeSchema.post('findOneAndUpdate', async function (doc) {
  const groupe = await mongoose.model('Groupe').findById(doc.proprietaire);
  if (groupe) {
    await groupe.updateCounts();
  }
  // Générer des alertes après la mise à jour
  await generateAlertsForVehicle(doc._id);
});

// Update group counts after delete
vehiculeSchema.post('remove', async function (doc) {
  const groupe = await mongoose.model('Groupe').findById(doc.proprietaire);
  if (groupe) {
    await groupe.updateCounts();
  }
});

module.exports = mongoose.model('Vehicule', vehiculeSchema);