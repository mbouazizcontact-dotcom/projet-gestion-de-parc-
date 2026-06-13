const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mecanicien = require('../models/Mecanicien');
const transporter = require('../config/emailConfig');
const Maintenance = require('../models/Maintenance');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé, token manquant', error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé', error: 'User not found' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect', error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user._id, permissions: user.permissions },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      permissions: user.permissions,
      userId: user._id,
      prenom: user.prenom,
      nom: user.nom,
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error.message);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion', error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error.message);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des utilisateurs',
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé', error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error.message);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération de l\'utilisateur',
      error: error.message,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.error('Erreur lors de la récupération de l\'utilisateur connecté:', error.message);
      return res.status(404).json({ message: 'Utilisateur non trouvé', error: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur connecté:', error.message);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération de l\'utilisateur connecté',
      error: error.message,
    });
  }
};

const createUser = [
  authMiddleware,
  async (req, res) => {
    try {
      const { 
        nom, 
        prenom, 
        nomFamille, 
        email, 
        telephone, 
        Groupe, 
        statut, 
        password, 
        confirmerMotDePasse, 
        permissions, 
        role,
        // Champs spécifiques aux mécaniciens
        experience,
        specialisation,
        garage
      } = req.body;

      console.log('Données reçues:', {
        nom,
        prenom,
        nomFamille,
        email,
        telephone,
        Groupe,
        statut,
        role,
        experience,
        specialisation,
        garage
      });

      // Exception 1 : Champs obligatoires vides
      if (!nom || !prenom || !nomFamille || !email || !password || !confirmerMotDePasse) {
        console.log('Validation échouée - Champs obligatoires manquants:', {
          nom: !!nom,
          prenom: !!prenom,
          nomFamille: !!nomFamille,
          email: !!email,
          password: !!password,
          confirmerMotDePasse: !!confirmerMotDePasse
        });
        return res.status(400).json({
          message: 'Veuillez remplir tous les champs obligatoires',
          error: 'Missing required fields',
        });
      }

      // Vérification des champs spécifiques aux mécaniciens
      if (role === 'Mécanicien') {
        console.log('Validation des champs mécanicien:', {
          experience: !!experience,
          specialisation: !!specialisation,
          garage: !!garage
        });
        if (!experience || !specialisation || !garage) {
          return res.status(400).json({
            message: 'Pour un mécanicien, veuillez remplir tous les champs obligatoires (expérience, spécialisation, garage)',
            error: 'Missing mechanic fields',
          });
        }
      }

      // Exception 6 : Email au format invalide
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({
          message: 'Veuillez entrer un email valide',
          error: 'Invalid email format',
        });
      }

      // Exception 2 : Email déjà existant
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          message: 'Un utilisateur avec cet email existe déjà',
          error: 'Email already exists',
        });
      }

      // Exception 3 : Mots de passe non correspondants
      if (password !== confirmerMotDePasse) {
        return res.status(400).json({
          message: 'Les mots de passe ne correspondent pas',
          error: 'Passwords do not match',
        });
      }

      // Exception 4 : Mot de passe trop court
      if (password.length < 8) {
        return res.status(400).json({
          message: 'Le mot de passe doit contenir au moins 8 caractères',
          error: 'Password too short',
        });
      }

      // Exception 7 : Numéro de téléphone invalide
      if (telephone && !/^\d{8}$/.test(telephone)) {
        return res.status(400).json({
          message: 'Le numéro de téléphone doit comporter exactement 8 chiffres',
          error: 'Invalid phone number',
        });
      }

      const defaultPermissions = {
        TableauDeBord: { creer: false, lire: true, modifier: false, supprimer: false },
        Conducteurs: { creer: false, lire: true, modifier: false, supprimer: false },
        Groupes: { creer: false, lire: true, modifier: false, supprimer: false },
        Vehicules: { 
          creer: false, 
          lire: true, 
          modifier: false, 
          supprimer: false, 
          modifierKilometrage: false 
        },
        Calendrier: { creer: false, lire: true, modifier: false, supprimer: false },
        Carburant: { creer: false, lire: true, modifier: false, supprimer: false },
        Maintenance: { creer: false, lire: true, modifier: false, supprimer: false },
        TypesMaintenances: { creer: false, lire: true, modifier: false, supprimer: false },
        MaintenanceReparations: { creer: false, lire: true, modifier: false, supprimer: false },
        Alertes: { creer: false, lire: true, modifier: false, supprimer: false },
        Atelier: { creer: false, lire: true, modifier: false, supprimer: false },
        Garages: { creer: false, lire: true, modifier: false, supprimer: false },
        Mecaniciens: { creer: false, lire: true, modifier: false, supprimer: false },
        Pieces: { creer: false, lire: true, modifier: false, supprimer: false },
        PiecesEnStock: { creer: false, lire: true, modifier: false, supprimer: false },
        PiecesDemandees: { creer: false, lire: true, modifier: false, supprimer: false },
        HistoriqueDesReparations: { creer: false, lire: true, modifier: false, supprimer: false },
        Archives: { creer: false, lire: true, modifier: false, supprimer: false },
        FicheReceptions: { creer: false, lire: true, modifier: false, supprimer: false },
        FicheInterventions: { creer: false, lire: true, modifier: false, supprimer: false },
        Reclamations: { creer: false, lire: true, modifier: false, supprimer: false },
        Utilisateurs: { creer: false, lire: true, modifier: false, supprimer: false },
        Parametres: { creer: false, lire: true, modifier: false, supprimer: false },
      };

      // Si c'est un mécanicien, ajouter les permissions spécifiques
      if (role === 'Mécanicien') {
        defaultPermissions.Maintenance = { creer: true, lire: true, modifier: true, supprimer: false };
        defaultPermissions.MaintenanceReparations = { creer: true, lire: true, modifier: true, supprimer: false };
        defaultPermissions.FicheInterventions = { creer: true, lire: true, modifier: true, supprimer: false };
        defaultPermissions.FicheReceptions = { creer: true, lire: true, modifier: true, supprimer: false };
        defaultPermissions.Vehicules.modifierKilometrage = true;
      }

      // Créer l'utilisateur
      const user = new User({
        nom,
        prenom,
        nomFamille,
        email,
        telephone,
        Groupe: Groupe || 'Aucun',
        statut: statut || 'Actif',
        role: role || 'Non spécifié',
        password,
        permissions: permissions ? { ...defaultPermissions, ...permissions } : defaultPermissions,
      });

      // Sauvegarder l'utilisateur
      const savedUser = await user.save();

      // Si c'est un mécanicien, créer aussi une entrée dans la table Mécanicien
      if (role === 'Mécanicien') {
        const mecanicien = new Mecanicien({
          nom,
          prenom,
          email,
          telephone,
          experience,
          specialisation,
          dateEmboche: new Date(),
          statut: 'Disponible',
          garage,
          user: savedUser._id // Lier le mécanicien à l'utilisateur
        });

        await mecanicien.save();
      }

      res.status(201).json(savedUser);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error.message);
      res.status(400).json({
        message: 'Erreur lors de la création de l\'utilisateur',
        error: error.message,
      });
    }
  },
];

const updateUser = [
  authMiddleware,
  async (req, res) => {
    try {
      const { nom, prenom, nomFamille, email, telephone, Groupe, statut, password, archived, permissions, role } = req.body;

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé', error: 'User not found' });
      }

      // Vérifier si l'utilisateur cible est un Super Admin
      if (user.role === 'Super Admin') {
        // Récupérer l'utilisateur qui fait la modification
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
          return res.status(404).json({ message: 'Utilisateur actuel non trouvé', error: 'Current user not found' });
        }

     

    
      }

      // Exception 1 : Champs obligatoires vides
      if (nom !== undefined && !nom) {
        return res.status(400).json({
          message: 'Veuillez remplir tous les champs obligatoires',
          error: 'Missing required field: nom',
        });
      }
      if (prenom !== undefined && !prenom) {
        return res.status(400).json({
          message: 'Veuillez remplir tous les champs obligatoires',
          error: 'Missing required field: prenom',
        });
      }
      if (nomFamille !== undefined && !nomFamille) {
        return res.status(400).json({
          message: 'Veuillez remplir tous les champs obligatoires',
          error: 'Missing required field: nomFamille',
        });
      }
      if (email !== undefined && !email) {
        return res.status(400).json({
          message: 'Veuillez remplir tous les champs obligatoires',
          error: 'Missing required field: email',
        });
      }

      // Exception 6 : Email au format invalide
      if (email !== undefined && !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({
          message: 'Veuillez entrer un email valide',
          error: 'Invalid email format',
        });
      }

      // Exception 2 : Email déjà existant
      if (email !== undefined) {
        const userExists = await User.findOne({ email, _id: { $ne: req.params.userId } });
        if (userExists) {
          return res.status(400).json({
            message: 'Un utilisateur avec cet email existe déjà',
            error: 'Email already exists',
          });
        }
      }

      // Exception 4 : Mot de passe trop court
      if (password && password.length < 8) {
        return res.status(400).json({
          message: 'Le mot de passe doit contenir au moins 8 caractères',
          error: 'Password too short',
        });
      }

      // Exception 7 : Numéro de téléphone invalide
      if (telephone !== undefined && telephone && !/^\d{8}$/.test(telephone)) {
        return res.status(400).json({
          message: 'Le numéro de téléphone doit comporter exactement 8 chiffres',
          error: 'Invalid phone number',
        });
      }

      // Mise à jour des champs
      const updateData = {
        nom,
        prenom,
        nomFamille,
        email,
        telephone,
        Groupe,
        statut,
        role,
        ...(archived !== undefined && { archived }),
        ...(permissions && { permissions }),
      };

      // Si un nouveau mot de passe est fourni, le hacher
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error.message);
      res.status(400).json({
        message: 'Erreur lors de la mise à jour de l\'utilisateur',
        error: error.message,
      });
    }
  },
];

const updatePermissions = [
  authMiddleware,
  async (req, res) => {
    try {
      const { permissions } = req.body;
      console.log('Permissions reçues dans updatePermissions:', JSON.stringify(req.body, null, 2));

      // Récupérer l'utilisateur à modifier
      const targetUser = await User.findById(req.params.userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé', error: 'User not found' });
      }

      // Récupérer l'utilisateur qui fait la modification
      const currentUser = await User.findById(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ message: 'Utilisateur actuel non trouvé', error: 'Current user not found' });
      }

      // Vérifier si l'utilisateur actuel est un Super Admin pour la modification
      if (currentUser.role !== 'Super Admin') {
        // Si ce n'est pas un Super Admin, on renvoie juste les permissions actuelles
        return res.status(200).json({
          ...targetUser.toObject(),
          permissions: targetUser.permissions
        });
      }

      // Si l'utilisateur cible est un Super Admin
      if (targetUser.role === 'Super Admin') {
        // Vérifier si c'est un autre Super Admin
        if (currentUser._id.toString() !== targetUser._id.toString() && currentUser.role !== 'Super Admin') {
          return res.status(403).json({ 
            message: 'Les permissions des autres Super Admins ne peuvent pas être modifiées',
            error: 'Cannot modify other Super Admin permissions'
          });
        }
      }

      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({
          message: 'Les permissions doivent être un objet valide',
          error: 'Invalid permissions format',
        });
      }

      const expectedKeys = [
        'TableauDeBord',
        'Conducteurs',
        'Groupes',
        'Vehicules',
        'Calendrier',
        'Carburant',
        'Maintenance',
        'TypesMaintenances',
        'MaintenanceReparations',
        'Alertes',
        'Atelier',
        'Garages',
        'Mecaniciens',
        'Pieces',
        'PiecesEnStock',
        'PiecesDemandees',
        'HistoriqueDesReparations',
        'Archives',
        'FicheReceptions',
        'FicheInterventions',
        'Reclamations',
        'Utilisateurs',
        'Parametres',
      ];

      // Initialize updated permissions with existing user permissions
      const updatedPermissions = { ...targetUser.permissions };

      // Validate and update permissions
      for (const key of Object.keys(permissions)) {
        if (!expectedKeys.includes(key)) {
          console.warn(`Clé inattendue ignorée: ${key}`);
          continue;
        }
        if (typeof permissions[key] === 'object') {
          updatedPermissions[key] = {
            ...updatedPermissions[key],
            ...permissions[key],
          };

          // Define valid sub-keys based on the feature
          const validSubKeys = key === 'Vehicules'
            ? ['creer', 'lire', 'modifier', 'supprimer', 'modifierKilometrage']
            : ['creer', 'lire', 'modifier', 'supprimer'];

          // Validate sub-keys and ensure boolean values
          for (const subKey of Object.keys(updatedPermissions[key])) {
            if (!validSubKeys.includes(subKey)) {
              delete updatedPermissions[key][subKey];
            } else if (typeof updatedPermissions[key][subKey] !== 'boolean') {
              return res.status(400).json({
                message: `La valeur de ${key}.${subKey} doit être un booléen`,
                error: 'Invalid permission value',
              });
            }
          }

          // Enforce logical dependency: If 'lire' is false, disable other permissions
          if (updatedPermissions[key].lire === false) {
            updatedPermissions[key].creer = false;
            updatedPermissions[key].modifier = false;
            updatedPermissions[key].supprimer = false;
            if (key === 'Vehicules') {
              updatedPermissions[key].modifierKilometrage = false;
            }
          }
        }
      }

      // Check if at least one 'lire' permission is enabled
      const hasAtLeastOneReadPermission = expectedKeys.some(
        key => updatedPermissions[key]?.lire === true
      );

      if (!hasAtLeastOneReadPermission) {
        return res.status(400).json({
          message: "L'utilisateur doit avoir au moins une permission de lecture pour accéder au système.",
          error: 'At least one read permission required',
        });
      }

      // Update user permissions and save
      targetUser.permissions = updatedPermissions;
      await targetUser.save();
      res.status(200).json(targetUser);
    } catch (error) {
      console.error('Erreur dans updatePermissions:', error);
      res.status(500).json({
        message: 'Erreur lors de la mise à jour des permissions',
        error: error.message,
      });
    }
  },
];

const deleteUser = [
  authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Si l'utilisateur est un mécanicien, vérifier s'il est affecté à une maintenance
      if (user.role === 'Mécanicien') {
        const mecanicien = await Mecanicien.findOne({ email: user.email });
        if (mecanicien) {
          // Vérifier si le mécanicien est affecté à une maintenance
          const maintenance = await Maintenance.findOne({ mechanic: mecanicien._id });
          if (maintenance) {
            return res.status(400).json({ 
              message: 'Impossible de supprimer l\'utilisateur car le mécanicien associé est affecté à une maintenance',
              maintenance: {
                id: maintenance._id,
                vehicule: maintenance.vehicule,
                datePrevue: maintenance.datePrevue
              }
            });
          }
          // Si pas de maintenance, supprimer l'entrée dans la table Mecanicien
          await Mecanicien.findByIdAndDelete(mecanicien._id);
        }
      }

      await User.findByIdAndDelete(req.params.userId);
      res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur', error: error.message });
    }
  }
];

const changerMotDePasse = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé', error: 'User not found' });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Ancien mot de passe incorrect',
        error: 'Invalid old password',
      });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error.message);
    res.status(500).json({
      message: 'Erreur serveur lors de la mise à jour du mot de passe',
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Email reçu pour réinitialisation:', email);
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Aucun compte associé à cette adresse email.' });
    }

    // Générer un token de réinitialisation
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Envoyer l'email de réinitialisation
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log('Lien de réinitialisation généré:', resetLink);
    
    // Configuration de l'email avec un template HTML amélioré
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Flotte3S',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #1a56db;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #ffffff;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              background-color: #1a56db;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
            .warning {
              background-color: #fef2f2;
              border: 1px solid #fee2e2;
              color: #991b1b;
              padding: 10px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <p>Bonjour ${user.prenom} ${user.nom},</p>
              
              <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Flotte3S.</p>
              
              <p>Pour réinitialiser votre mot de passe, veuillez cliquer sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
              </div>
              
              <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
              <p style="word-break: break-all;">${resetLink}</p>
              
              <div class="warning">
                <strong>Important :</strong>
                <ul>
                  <li>Ce lien est valable pendant 1 heure</li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email</li>
                  <li>Pour votre sécurité, ne partagez jamais ce lien avec quelqu'un d'autre</li>
                </ul>
              </div>
              
              <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à contacter notre support.</p>
              
              <p>Cordialement,<br>L'équipe Flotte3S</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>&copy; ${new Date().getFullYear()} Flotte3S. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log('Tentative d\'envoi d\'email...');
    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', info.response);

    res.status(200).json({
      message: 'Email de réinitialisation envoyé avec succès'
    });

  } catch (error) {
    console.error('Erreur détaillée lors de la demande de réinitialisation:', error);
    res.status(500).json({
      message: 'Erreur lors de la demande de réinitialisation',
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: 'Token et nouveau mot de passe requis',
        error: 'Missing required fields'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé',
        error: 'User not found'
      });
    }

    // Vérifier si le token n'a pas expiré
    if (decoded.exp < Date.now() / 1000) {
      return res.status(400).json({
        message: 'Le lien de réinitialisation a expiré',
        error: 'Token expired'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error.message);
    res.status(500).json({
      message: 'Erreur serveur lors de la réinitialisation du mot de passe',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  updatePermissions,
  deleteUser,
  changerMotDePasse,
  forgotPassword,
  authMiddleware,
  resetPassword,
};