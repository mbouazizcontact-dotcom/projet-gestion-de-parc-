const Maintenance = require('../models/Maintenance');
const Vehicule = require('../models/Vehicule');
const Mecanicien = require('../models/Mecanicien');
const User = require('../models/user');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const getEisenhowerQuadrantAndStatus = (urgence, importance, currentStatus) => {
  let quadrant;
  let newStatus = currentStatus;

  // Calculate quadrant
  if (urgence && importance) {
    quadrant = 'Faire immédiatement';
    newStatus = 'À faire';
  } else if (!urgence && importance) {
    quadrant = 'Planifier';
    newStatus = 'Backlog';
  } else if (urgence && !importance) {
    quadrant = 'Déléguer';
    newStatus = 'À faire';
  } else {
    quadrant = 'Éliminer/Reporter';
    newStatus = 'Backlog';
  }

  // Only update status to 'Backlog' or 'À faire' if current status is not in progress or completed
  if (['En cours', 'Vérification', 'Terminée'].includes(currentStatus)) {
    newStatus = currentStatus;
  }

  return { quadrant, newStatus };
};

const updateVehicleStatus = async (vehicleId, maintenanceStatus) => {
  let vehicleStatus;
  switch (maintenanceStatus) {
    case 'Backlog':
    case 'À faire':
      vehicleStatus = 'Accidenté';
      break;
    case 'En cours':
    case 'Vérification':
      vehicleStatus = 'En réparation';
      break;
    case 'Terminée':
      vehicleStatus = 'Fonctionnel';
      break;
    default:
      return; 
  }

  await Vehicule.findByIdAndUpdate(vehicleId, { etat: vehicleStatus }, { new: true });
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.createMaintenance = async (req, res) => {
  try {
    const { vehicule, typeMaintenance, dateReservation, datePrevue, statut, notes, importance, urgence, kilometrage, mechanic, garage } = req.body;

    // Validate required fields
    if (!vehicule || !typeMaintenance || !datePrevue || !kilometrage) {
      return res.status(400).json({ message: 'Véhicule, type de maintenance, date prévue et kilométrage sont requis.' });
    }

    // Validate kilometrage
    if (isNaN(kilometrage) || Number(kilometrage) < 0) {
      return res.status(400).json({ message: 'Le kilométrage doit être un nombre positif.' });
    }

    // Validate mechanic and garage IDs if provided
    if (mechanic && !mongoose.Types.ObjectId.isValid(mechanic)) {
      return res.status(400).json({ message: 'ID du mécanicien invalide.' });
    }
    if (garage && !mongoose.Types.ObjectId.isValid(garage)) {
      return res.status(400).json({ message: 'ID du garage invalide.' });
    }

    // Calculate initial status based on urgence and importance
    const { newStatus } = getEisenhowerQuadrantAndStatus(urgence, importance, statut || 'Backlog');

    const maintenance = new Maintenance({
      vehicule,
      typeMaintenance,
      dateReservation: dateReservation || Date.now(),
      datePrevue,
      statut: newStatus,
      notes,
      urgence: urgence || false,
      importance: importance || false,
      kilometrage: Number(kilometrage),
      mechanic: mechanic || null,
      garage: garage || null,
    });

    await maintenance.save();
    console.log('Maintenance saved:', JSON.stringify(maintenance, null, 2));

    // Update vehicle status based on maintenance status
    await updateVehicleStatus(vehicule, maintenance.statut);

    // Populate referenced fields for response
    const populatedMaintenance = await Maintenance.findById(maintenance._id)
      .populate('vehicule', 'marque modele immatriculation etat kilometrage')
      .populate('typeMaintenance', 'nom type_intervention')
      .populate('mechanic', 'nom prenom')
      .populate('garage', 'nom adresse');

    console.log('Populated maintenance:', JSON.stringify(populatedMaintenance, null, 2));

    // Envoyer l'email de notification
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: mechanic.email,
        subject: 'Nouvelle tâche de maintenance',
        html: `
          <h1>Nouvelle tâche de maintenance</h1>
          <p>Bonjour ${mechanic.nom} ${mechanic.prenom},</p>
          <p>Une nouvelle tâche de maintenance vous a été assignée :</p>
          <ul>
            <li>Véhicule : ${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})</li>
            <li>Type : ${maintenance.type}</li>
            <li>Date prévue : ${maintenance.datePrevue}</li>
            <li>Description : ${maintenance.description}</li>
          </ul>
          <p>Merci de vous connecter à l'application pour plus de détails.</p>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // On continue l'exécution même si l'envoi d'email échoue
    }

    res.status(201).json(populatedMaintenance);
  } catch (error) {
    console.error('Erreur lors de la création de la maintenance:', {
      message: error.message,
      stack: error.stack,
      requestBody: JSON.stringify(req.body, null, 2),
    });
    res.status(400).json({ message: error.message || 'Erreur lors de la création de la maintenance.' });
  }
};

exports.getAllMaintenances = async (req, res) => {
  try {
    const { vehicule, statut, startDate, endDate, mechanic, garage } = req.query;
    const query = {};

    if (vehicule) query.vehicule = vehicule;
    if (statut) query.statut = statut;
    if (mechanic) query.mechanic = mechanic;
    if (garage) query.garage = garage;
    if (startDate || endDate) {
      query.datePrevue = {};
      if (startDate) query.datePrevue.$gte = new Date(startDate);
      if (endDate) query.datePrevue.$lte = new Date(endDate);
    }

    const maintenances = await Maintenance.find(query)
      .populate('vehicule', 'marque modele immatriculation etat kilometrage')
      .populate('typeMaintenance', 'nom type_intervention')
      .populate('mechanic', 'nom prenom')
      .populate('garage', 'nom adresse')
      .sort({ datePrevue: -1 });

    res.json(maintenances);
  } catch (error) {
    console.error('Erreur lors de la récupération des maintenances:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMaintenanceById = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('vehicule', 'marque modele immatriculation etat kilometrage')
      .populate('typeMaintenance', 'nom type_intervention')
      .populate('mechanic', 'nom prenom')
      .populate('garage', 'nom adresse');

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance non trouvée.' });
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Erreur lors de la récupération de la maintenance:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const { vehicule, typeMaintenance, dateReservation, datePrevue, statut, notes, importance, urgence, kilometrage, mechanic, garage } = req.body;

    console.log('Received update data:', JSON.stringify(req.body, null, 2));

    // Fetch existing maintenance to get current state
    const existingMaintenance = await Maintenance.findById(req.params.id);
    if (!existingMaintenance) {
      return res.status(404).json({ message: 'Maintenance non trouvée.' });
    }

    // Prepare update data with existing values as defaults
    const updateData = {
      vehicule: vehicule || existingMaintenance.vehicule,
      typeMaintenance: typeMaintenance || existingMaintenance.typeMaintenance,
      dateReservation: dateReservation || existingMaintenance.dateReservation,
      datePrevue: datePrevue || existingMaintenance.datePrevue,
      notes: notes !== undefined ? notes : existingMaintenance.notes,
      kilometrage: kilometrage !== undefined ? Number(kilometrage) : existingMaintenance.kilometrage,
      mechanic: mechanic !== undefined ? mechanic || null : existingMaintenance.mechanic,
      garage: garage !== undefined ? garage || null : existingMaintenance.garage,
      urgence: urgence !== undefined ? urgence : existingMaintenance.urgence,
      importance: importance !== undefined ? importance : existingMaintenance.importance,
    };

    // Calculate quadrant and status based on urgence and importance
    const { newStatus } = getEisenhowerQuadrantAndStatus(
      updateData.urgence,
      updateData.importance,
      statut || existingMaintenance.statut
    );
    updateData.statut = newStatus;

    // Validate required fields only if they are provided in the request
    if (vehicule && !mongoose.Types.ObjectId.isValid(vehicule)) {
      return res.status(400).json({ message: 'ID du véhicule invalide.' });
    }
    if (typeMaintenance && !mongoose.Types.ObjectId.isValid(typeMaintenance)) {
      return res.status(400).json({ message: 'ID du type de maintenance invalide.' });
    }
    if (kilometrage !== undefined && (isNaN(kilometrage) || Number(kilometrage) < 0)) {
      return res.status(400).json({ message: 'Le kilométrage doit être un nombre positif.' });
    }
    if (mechanic && !mongoose.Types.ObjectId.isValid(mechanic)) {
      return res.status(400).json({ message: 'ID du mécanicien invalide.' });
    }
    if (garage && !mongoose.Types.ObjectId.isValid(garage)) {
      return res.status(400).json({ message: 'ID du garage invalide.' });
    }

    // Validate urgence and importance
    if (urgence !== undefined && typeof urgence !== 'boolean') {
      return res.status(400).json({ message: 'L\'urgence doit être un booléen.' });
    }
    if (importance !== undefined && typeof importance !== 'boolean') {
      return res.status(400).json({ message: 'L\'importance doit être un booléen.' });
    }

    // Update maintenance
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance non trouvée.' });
    }

    console.log('Maintenance updated:', JSON.stringify(maintenance, null, 2));

    // Update vehicle status
    await updateVehicleStatus(updateData.vehicule, updateData.statut);

    // Populate referenced fields for response
    const populatedMaintenance = await Maintenance.findById(maintenance._id)
      .populate('vehicule', 'marque modele immatriculation etat kilometrage')
      .populate('typeMaintenance', 'nom type_intervention')
      .populate('mechanic', 'nom prenom')
      .populate('garage', 'nom adresse');

    console.log('Populated maintenance:', JSON.stringify(populatedMaintenance, null, 2));
    res.json(populatedMaintenance);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la maintenance:', {
      message: error.message,
      stack: error.stack,
      requestBody: JSON.stringify(req.body, null, 2),
    });
    res.status(400).json({ message: error.message || 'Erreur lors de la mise à jour de la maintenance.' });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance non trouvée.' });
    }

    await Maintenance.findByIdAndDelete(req.params.id);
    console.log('Maintenance deleted:', req.params.id);

    // Optionally, reset vehicle status to 'Fonctionnel'
    await updateVehicleStatus(maintenance.vehicule, 'Terminée');

    res.json({ message: 'Maintenance supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la maintenance:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMaintenancesByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({ message: 'ID de véhicule invalide' });
    }

    const maintenances = await Maintenance.find({ vehicule: vehicleId })
      .populate('vehicule', 'marque modele immatriculation etat kilometrage')
      .populate('typeMaintenance', 'nom type_intervention')
      .populate('mechanic', 'nom prenom')
      .populate('garage', 'nom adresse')
      .sort({ datePrevue: -1 });

    res.status(200).json(maintenances);
  } catch (error) {
    console.error('Erreur lors de la récupération des maintenances du véhicule:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des maintenances du véhicule',
      error: error.message,
    });
  }
};
exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { statut } = req.body;
    const existingMaintenance = await Maintenance.findById(req.params.id);
    if (!existingMaintenance) {
      return res.status(404).json({ message: 'Maintenance non trouvée.' });
    }

    const validTransitions = {
      Backlog: ['À faire', 'En cours'],
      'À faire': ['Backlog', 'En cours'],
      'En cours': ['Vérification', 'Terminée'],
      Vérification: ['Terminée', "En cours"],
      Terminée: [], // No further transitions allowed
    };

    const currentStatus = existingMaintenance.statut;
    if (!validTransitions[currentStatus].includes(statut)) {
      return res.status(400).json({
        message: `Transition invalide : impossible de passer de "${currentStatus}" à "${statut}".`,
      });
    }

    let updateData = { statut };
    if (statut === 'Backlog' && currentStatus !== 'Backlog') {
      updateData.urgence = false;
    } else if (statut === 'À faire' && currentStatus !== 'À faire') {
      updateData.urgence = true;
    }
    updateData.importance = existingMaintenance.importance;

    if (statut === 'Terminée' && currentStatus !== 'En cours' && currentStatus !== 'Vérification') {
      return res.status(400).json({
        message: 'Une maintenance ne peut être terminée que si elle est en cours ou en vérification.',
      });
    }

    const updatedMaintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('vehicule', 'marque modele immatriculation etat kilometrage')
      .populate('typeMaintenance', 'nom type_intervention')
      .populate('mechanic', 'nom prenom')
      .populate('garage', 'nom adresse');

    await updateVehicleStatus(updatedMaintenance.vehicule._id, statut);

    console.log(`Statut mis à jour avec succès : ${currentStatus} -> ${statut}`, updatedMaintenance);
    return res.status(200).json({
      message: 'Statut de la maintenance mis à jour avec succès.',
      maintenance: updatedMaintenance,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    return res.status(500).json({
      message: 'Erreur serveur lors de la mise à jour du statut.',
      error: error.message,
    });
  }
};