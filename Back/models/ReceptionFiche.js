const mongoose = require('mongoose');

const receptionFicheSchema = new mongoose.Schema({
  maintenanceId: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
  },
  time: {
    type: String,
    trim: true,
  },
  receivedBy: {
    type: String,
    trim: true,
  },
  employee: {
 type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: false,
  },
  carMake: {
    type: String,
    trim: true,
  },
  licensePlate: {
    type: String,
    trim: true,
  },
  mileage: {
    type: Number,
  },
  fuelLevel: {
    type: String,
    trim: true,
    default: '',
  },
  engineOilLevel: {
    type: String,
    trim: true,
    default: '',
  },
  coolantLevel: {
    type: String,
    trim: true,
    default: '',
  },
  brakeFluidLevel: {
    type: String,
    trim: true,
    default: '',
  },
  otherFluids: {
    type: String,
    trim: true,
    default: '',
  },
  periodicMaintenance: {
    type: Boolean,
    default: false,
  },
  mechanicalRepair: {
    type: Boolean,
    default: false,
  },
  electricalIssue: {
    type: Boolean,
    default: false,
  },
  otherReason: {
    type: Boolean,
    default: false,
  },
  otherReasonText: {
    type: String,
    trim: true,
    default: '',
  },
  unusualNoise: {
    type: Boolean,
    default: false,
  },
  powerLoss: {
    type: Boolean,
    default: false,
  },
  warningLight: {
    type: Boolean,
    default: false,
  },
  otherProblems: {
    type: String,
    trim: true,
    default: '',
  },
  visualChecks: {
    type: String,
    trim: true,
    default: '',
  },
  preInterventionDiagnosis: {
    type: String,
    trim: true,
    default: '',
  },
  uploadedImage: {
    type: String, // Chemin de l'image
    default: null,
  },
  markerPositions: [
    {
      x: {
        type: Number,
      },
      y: {
        type: Number,
      },
    },
  ],
  employeeSignatureDate: {
    type: Date,
    default: null,
  },
  mechanicSignatureDate: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  requestedParts: [
    {
      type: String,
      trim: true,
    },
  ],
});

module.exports = mongoose.model('ReceptionFiche', receptionFicheSchema);