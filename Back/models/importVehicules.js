require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const connectDB = require('../config/db');
const Vehicule = require('../models/Vehicule');
const Groupe = require('../models/groupe');

// Fonction pour convertir une date Excel en objet Date JS
function convertirDateExcel(excelDate) {
  if (typeof excelDate === 'number') {
    const parsed = xlsx.SSF.parse_date_code(excelDate);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  } else if (!isNaN(Date.parse(excelDate))) {
    return new Date(excelDate);
  }
  return new Date(); // Par défaut
}

const importerVehicules = async () => {
  try {
    await connectDB();
    console.log('Connecté à MongoDB');

    // Cache pour stocker les groupes déjà créés (évite les requêtes répétées)
    const groupesCache = {};

    // Fonction pour obtenir ou créer un groupe
    const getOrCreateGroupe = async (nomGroupe) => {
      // Si le nom est vide, retourner null
      if (!nomGroupe || nomGroupe.trim() === '') {
        return null;
      }
      
      // Si le groupe est déjà dans le cache, le retourner
      if (groupesCache[nomGroupe]) {
        return groupesCache[nomGroupe];
      }
      
      // Chercher le groupe dans la base de données
      let groupe = await Groupe.findOne({ nom: nomGroupe });
      
      if (!groupe) {
        // Créer un nouveau groupe si nécessaire
        groupe = new Groupe({
          nom: nomGroupe,
          // Les statistiques seront calculées automatiquement grâce aux hooks
        });
        await groupe.save();
        console.log(`📊 Nouveau groupe créé: ${nomGroupe} avec ID: ${groupe._id}`);
      }
      
      // Ajouter le groupe au cache
      groupesCache[nomGroupe] = groupe._id;
      
      return groupe._id;
    };

    const workbook = xlsx.readFile('C:/Users/DELL/Desktop/PFE-code/Back/Flotte3S.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log(`Nombre total d'entrées dans le fichier Excel: ${data.length}`);

    let compteurInsertions = 0;
    let compteurMisesAJour = 0;
    let compteurErreurs = 0;

    for (const item of data) {
      try {
        const mecDate = convertirDateExcel(item['MEC']);

        const immatriculation = item['IMMATRICULATION']?.trim();
        if (!immatriculation) {
          console.warn('⛔ Véhicule ignoré (immatriculation manquante)');
          continue;
        }

        // Récupérer le nom du propriétaire depuis Excel
        const nomProprietaire = item['PROPRIETAIRE']?.trim() || "Groupe par défaut";
        
        // Obtenir l'ID du groupe correspondant (crée le groupe si nécessaire)
        const proprietaireId = await getOrCreateGroupe(nomProprietaire);

        const existing = await Vehicule.findOne({ immatriculation });

        if (existing) {
          // Mise à jour
          existing.marque = item['MARQUE']?.trim() || existing.marque;
          existing.modele = item['MODELE']?.trim() || existing.modele;
          existing.mec = mecDate;
          existing.etat = item['ETAT']?.trim() || existing.etat;
          existing.proprietaire = proprietaireId || existing.proprietaire;
          existing.numChassis = item['NUM_CHASSIS']?.trim() || existing.numChassis;
          existing.typeMines = item['TYPE_MINES']?.trim() || existing.typeMines;

          await existing.save();
          compteurMisesAJour++;
          console.log(`♻️ ${existing.immatriculation} mis à jour.`);
        } else {
          // Insertion
          const vehicule = new Vehicule({
            marque: item['MARQUE']?.trim() || "",
            modele: item['MODELE']?.trim() || "",
            immatriculation,
            mec: mecDate,
            etat: item['ETAT']?.trim() || "Fonctionnel",
            proprietaire: proprietaireId,
            numChassis: item['NUM_CHASSIS']?.trim() || immatriculation, // Utiliser immatriculation si chassis manquant
            typeMines: item['TYPE_MINES']?.trim() || "",
            kilometrage: item['KILOMETRAGE']?.toString() || "",
            conducteur: null
          });

          await vehicule.save();
          compteurInsertions++;
          console.log(`✅ ${vehicule.immatriculation} inséré avec succès.`);
        }

      } catch (err) {
        compteurErreurs++;
        console.error(`❌ Erreur avec le véhicule [${item['IMMATRICULATION'] || 'N/A'}] : ${err.message}`);
      }
    }

    // Mettre à jour toutes les statistiques des groupes
    console.log('Mise à jour des statistiques des groupes...');
    const groupes = await Groupe.find();
    for (const groupe of groupes) {
      await groupe.updateCounts();
      console.log(`Statistiques mises à jour pour le groupe: ${groupe.nom}`);
    }

    console.log('\n📊 RÉSUMÉ DE L\'IMPORTATION:');
    console.log(`✅ Véhicules insérés: ${compteurInsertions}`);
    console.log(`♻️ Véhicules mis à jour: ${compteurMisesAJour}`);
    console.log(`❌ Erreurs rencontrées: ${compteurErreurs}`);
    console.log(`📂 Groupes créés/utilisés: ${Object.keys(groupesCache).length}`);

  } catch (error) {
    console.error('Erreur générale:', error);
  } finally {
    await mongoose.disconnect();
    console.log("📦 Importation terminée !");
  }
};

// Lancement
importerVehicules();