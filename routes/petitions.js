const express = require('express');
const router = express.Router();
const { 
  getAllPetitions, 
  getPetitionById, 
  createPetition, 
  signPetition 
} = require('../controllers/petitionController');
const { protect } = require('../middleware/auth');

router.get('/', getAllPetitions);
router.get('/:id', getPetitionById);
router.post('/', protect, createPetition);
router.post('/:id/sign', protect, signPetition);

module.exports = router;
