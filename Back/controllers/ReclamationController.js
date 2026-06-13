const Reclamation = require('../models/Reclamation');

createReclamation = async (req, res) => {
  try {
    const { name, email, subject, message, recipient } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Veuillez remplir tous les champs obligatoires' });
    }
    const reclamation = new Reclamation({
      name,
      email,
      subject,
      message,
      recipient: recipient || 'Admin'
    });
    await reclamation.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Réclamation soumise avec succès',
      data: reclamation 
    });
  } catch (error) {
    console.error('Erreur lors de la création de la réclamation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la soumission de la réclamation' 
    });
  }
};
getAllReclamations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const query = status !== 'all' ? { status } : {}; // Filtrage par statut si nécessaire
    
    const reclamations = await Reclamation.find(query)
      .skip((page - 1) * limit)  // Saute les éléments des pages précédentes
      .limit(Number(limit))  // Limite le nombre d'éléments par page
      .sort({ createdAt: -1 });  // Trie par date descendante
    
    const totalReclamations = await Reclamation.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: totalReclamations,
      data: reclamations,
      totalPages: Math.ceil(totalReclamations / limit),  // Nombre total de pages
      currentPage: Number(page)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réclamations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des réclamations' 
    });
  }
};


getReclamationById = async (req, res) => {
  try {
    const reclamation = await Reclamation.findById(req.params.id);
    
    if (!reclamation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Réclamation non trouvée' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: reclamation 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réclamation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de la réclamation' 
    });
  }
};

updateReclamationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Statut invalide' 
      });
    }

    const reclamation = await Reclamation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!reclamation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Réclamation non trouvée' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: reclamation 
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réclamation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la réclamation' 
    });
  }
};

module.exports = { createReclamation, getAllReclamations,getReclamationById,updateReclamationStatus};

