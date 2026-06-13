// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const AutoIncrement = require('mongoose-sequence')(mongoose);

// const maintenanceSchema = new Schema({
//   id: Number, 
//   Conducteur: { type: Schema.Types.ObjectId, ref: 'Conducteur', required: true },
//   mecanicien: { type: Schema.Types.ObjectId, ref: 'Mecanicien', required: true },
//   vehicule: { type: Schema.Types.ObjectId, ref: 'Vehicule', required: true },
//   symptomes_panne: { type: String, required: true },
//   dateDepot: { type: Date, required: true },
//   etat: { type: String, enum: ['En attente', 'Terminé'], default: 'En attente' },
//   date_prevue_remise: { type: Date, required: true }
// });

// maintenanceSchema.plugin(AutoIncrement, { inc_field: 'id' });

// module.exports = mongoose.model('demandeMaintenance', maintenanceSchema);
