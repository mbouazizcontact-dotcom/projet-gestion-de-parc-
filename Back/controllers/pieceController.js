const Piece = require('../models/piece');

// Créer une pièce
exports.createPiece = async (req, res) => {
  try {
    const piece = new Piece(req.body);
    await piece.save();
    res.status(201).json(piece);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtenir toutes les pièces
exports.getAllPieces = async (req, res) => {
  try {
    const pieces = await Piece.find().populate('vehiculeAssigne', 'marque modele immatriculation');
    res.json(pieces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir une pièce par ID
exports.getPieceById = async (req, res) => {
  try {
    const piece = await Piece.findById(req.params.id).populate('vehiculeAssigne', 'marque modele immatriculation');
    if (!piece) return res.status(404).json({ message: 'Pièce non trouvée' });
    res.json(piece);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une pièce
exports.updatePiece = async (req, res) => {
  try {
    const piece = await Piece.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('vehiculeAssigne', 'marque modele immatriculation');
    if (!piece) return res.status(404).json({ message: 'Pièce non trouvée' });
    res.json(piece);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une pièce
exports.deletePiece = async (req, res) => {
  try {
    const piece = await Piece.findByIdAndDelete(req.params.id);
    if (!piece) return res.status(404).json({ message: 'Pièce non trouvée' });
    res.json({ message: 'Pièce supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};