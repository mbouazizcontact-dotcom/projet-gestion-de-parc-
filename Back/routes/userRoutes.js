const express = require('express');
const router = express.Router();
const {
  login,
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  updatePermissions,
  deleteUser,
  changerMotDePasse,
  authMiddleware,
  forgotPassword,
  resetPassword
} = require('../controllers/userController');

// Routes
router.post('/login', login);
router.get('/', authMiddleware, getAllUsers);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/:userId', authMiddleware, getUserById);
router.post('/', createUser);
router.put('/changer-mot-de-passe', authMiddleware, changerMotDePasse); // Placé avant /:userId
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/:userId', updateUser);
router.put('/:userId/permissions', updatePermissions);
router.delete('/:userId', deleteUser);

module.exports = router;