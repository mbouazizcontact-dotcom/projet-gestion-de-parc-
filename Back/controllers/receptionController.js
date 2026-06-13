// Récupérer le mécanicien qui a réceptionné un véhicule
exports.getVehicleReceptionMecanicien = async (req, res) => {
  try {
    const reception = await Reception.findOne({ vehicule: req.params.vehicleId })
      .populate('mecanicien', 'prenom nom')
      .sort({ dateReception: -1 }); // Prendre la réception la plus récente

    if (!reception) {
      return res.status(404).json({ message: 'Aucune réception trouvée pour ce véhicule' });
    }

    res.json({ mecanicien: reception.mecanicien });
  } catch (error) {
    console.error('Erreur lors de la récupération du mécanicien:', error);
    res.status(500).json({ message: error.message });
  }
}; 