const Maintenance = require('../models/Maintenance');
const demandeMaintenance = require('../models/demandeMaintenance');
const Commande =require('../models/DemandePiece');
exports.getStatistiques = async (req, res) => {
  try {
    console.log("📌 Récupération des statistiques en cours...");

    console.log("🔎 Vérification de `enattente`...");
    const reparationsEnattente = await demandeMaintenance.estimatedDocumentCount({ etat: "En attente" });
    console.log("✅ Nombre de réparations en attente :", reparationsEnattente);

    console.log("🔎 Vérification de `maintenance`...");
    const reparationsTerminees = await Maintenance.estimatedDocumentCount({ etat: "Terminé" });
    console.log("✅ Nombre de réparations terminées :", reparationsTerminees);

    console.log("🔎 Vérification de `piece`...");
    const totalPiecesDemandées = await Commande.countDocuments({});
    console.log("✅ Nombre total de pièces demandées :", totalPiecesDemandées);

    res.status(200).json({
      reparationsEnattente,
      reparationsTerminees,
      totalPiecesDemandées
    });
  } catch (error) {
    console.error("❌ Erreur lors du calcul des statistiques :", error);
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques', error: error.message });
  }
};
