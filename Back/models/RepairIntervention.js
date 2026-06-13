const mongoose = require('mongoose');

const repairInterventionSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  mechanic: { type: String, required: true },   
  carMake: { type: String, required: true },
  licensePlate: { type: String, required: true },
  mileage: { type: String, required: true },
  oilAmount: { type: String, default: '' },
  oilFilter: { type: Boolean, default: false },
  airFilter: { type: Boolean, default: false },
  fuelFilter: { type: Boolean, default: false },
  cabinFilter: { type: Boolean, default: false },
  fluidTopUp: { type: Boolean, default: false },
  wheelRotation: { type: Boolean, default: false },
  repairs: [{ type: String }],
  observations: [{ type: String }],
  employeeSignatureDate: { type: String, default: '' },
  mechanicSignatureDate: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('RepairIntervention', repairInterventionSchema);