const RepairIntervention = require('../models/RepairIntervention');

exports.createRepairIntervention = async (req, res) => {
  try {
    const repairData = req.body;
    
    const requiredFields = ['date', 'time', 'mechanic', 'carMake', 'licensePlate', 'mileage'];
    for (const field of requiredFields) {
      if (!repairData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    const newIntervention = new RepairIntervention({
      ...repairData,
      repairs: repairData.repairs.filter(repair => repair.trim() !== ''),
      observations: repairData.observations.filter(obs => obs.trim() !== ''), 
    });

    await newIntervention.save();
    res.status(201).json({ message: 'Repair intervention created successfully', data: newIntervention });
  } catch (error) {
    console.error('Error creating repair intervention:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
exports.deleteRepairIntervention = async (req, res) => {
  try {
    const intervention = await RepairIntervention.findById(req.params.id);
    if (!intervention) {
      return res.status(404).json({
        error: "Repair intervention not found",
      });
    }

    await RepairIntervention.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Repair intervention deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting repair intervention:", error);
    res.status(500).json({
      error: "Server error",
    });
  }
};

exports.getAllRepairInterventions = async (req, res) => {
  try {
    const interventions = await RepairIntervention.find().sort({ createdAt: -1 });
    res.status(200).json(interventions);
  } catch (error) {
    console.error('Error fetching repair interventions:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a single repair intervention by ID
exports.getRepairInterventionById = async (req, res) => {
  try {
    const intervention = await RepairIntervention.findById(req.params.id);
    if (!intervention) {
      return res.status(404).json({ error: 'Repair intervention not found' });
    }
    res.status(200).json(intervention);
  } catch (error) {
    console.error('Error fetching repair intervention:', error);
    res.status(500).json({ error: 'Server error' });
  }
};