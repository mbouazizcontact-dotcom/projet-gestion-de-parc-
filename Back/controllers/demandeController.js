const Demande = require('../models/DemandePiece');
const Piece = require('../models/piece'); 

// Créer une demande
exports.createDemande = async (req, res) => {
  try {
    const demande = new Demande({
      ...req.body,
      demandeur: req.body.demandeur // Utiliser directement le champ demandeur
    });
    await demande.save();
    
    // Récupérer la demande avec les données du mécanicien
    const demandePopulated = await Demande.findById(demande._id).populate('demandeur', 'prenom nom');
    res.status(201).json(demandePopulated);
  } catch (error) {
    console.error('Erreur création demande:', error);
    res.status(400).json({ message: error.message });
  }
};

// Obtenir toutes les demandes
exports.getAllDemandes = async (req, res) => {
  try {
    const demandes = await Demande.find().populate('demandeur', 'prenom nom');
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir une demande par ID
exports.getDemandeById = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id).populate('demandeur', 'prenom nom');
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });
    res.json(demande);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approuver une demande
exports.approveDemande = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id).populate('demandeur', 'prenom nom');
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });

    demande.etat = 'Approuvé';
    await demande.save();

    // Créer une nouvelle pièce dans le stock avec les informations du véhicule
    const nouvellePiece = new Piece({
      reference: req.body.reference || `REF-${demande._id}`,
      nom: demande.pieces,
      marque: demande.marque,
      modele: demande.modele,
      immatriculation: demande.immatriculation,
      categorie: req.body.categorie || 'Non spécifié',
      dateEntree: req.body.dateEntree || new Date(),
      etat: req.body.etat || 'Neuf',
    });
    await nouvellePiece.save();

    res.json(nouvellePiece);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Refuser une demande
exports.rejectDemande = async (req, res) => {
  try {
    const demande = await Demande.findByIdAndUpdate(
      req.params.id,
      { etat: 'Refusé' },
      { new: true, runValidators: true }
    ).populate('demandeur', 'prenom nom');
    
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });
    res.json(demande);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};