const Carburant = require('../models/Carburant');

// Récupérer toutes les consommations
exports.getAllCarburant = async (req, res) => {
  try {
    const carburants = await Carburant.find()
      .populate({
        path: 'vehicule',
        select: 'marque modele immatriculation proprietaire',
        populate: {
          path: 'proprietaire',
          select: 'nom'
        }
      })
      .sort({ date: -1 });
    res.json(carburants);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des consommations: ' + error.message });
  }
};

// Récupérer une consommation spécifique
exports.getCarburantById = async (req, res) => {
  try {
    const carburant = await Carburant.findById(req.params.id)
      .populate({
        path: 'vehicule',
        select: 'marque modele immatriculation proprietaire',
        populate: {
          path: 'proprietaire',
          select: 'nom'
        }
      });
    if (!carburant) {
      return res.status(404).json({ message: 'Consommation non trouvée' });
    }
    res.json(carburant);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la consommation: ' + error.message });
  }
};

// Créer une nouvelle consommation
exports.createCarburant = async (req, res) => {
  try {
    const carburant = new Carburant(req.body);
    const newCarburant = await carburant.save();
    const populatedCarburant = await Carburant.findById(newCarburant._id)
      .populate({
        path: 'vehicule',
        select: 'marque modele immatriculation proprietaire',
        populate: {
          path: 'proprietaire',
          select: 'nom'
        }
      });
    res.status(201).json(populatedCarburant);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la création de la consommation: ' + error.message });
  }
};

// Mettre à jour une consommation
exports.updateCarburant = async (req, res) => {
  try {
    const carburant = await Carburant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate({
        path: 'vehicule',
        select: 'marque modele immatriculation proprietaire',
        populate: {
          path: 'proprietaire',
          select: 'nom'
        }
      });
    if (!carburant) {
      return res.status(404).json({ message: 'Consommation non trouvée' });
    }
    res.json(carburant);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la mise à jour de la consommation: ' + error.message });
  }
};

// Supprimer une consommation
exports.deleteCarburant = async (req, res) => {
  try {
    const carburant = await Carburant.findByIdAndDelete(req.params.id);
    if (!carburant) {
      return res.status(404).json({ message: 'Consommation non trouvée' });
    }
    res.json({ message: 'Consommation supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la consommation: ' + error.message });
  }
};