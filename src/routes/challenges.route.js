const express = require('express');
const router = express.Router();
const challengesController = require('../controllers/challenges.controller');
const authenticateToken = require('../middlewares/auth');

router.use('/solve', authenticateToken);
router.use('/inactiveChallenges', authenticateToken);
router.use('/addChallenge', authenticateToken);
router.use('/removeChallenge', authenticateToken);
router.use('/byId/:challId', authenticateToken);

router.get('/inactiveChallenges', challengesController.getInactiveChallenges);
router.get('/currentChallenges', challengesController.getCurrentChallenges);
router.get('/byId/:challId', challengesController.getChallengeById);

router.post('/solve', challengesController.sendAnswer);
router.post('/addChallenge', challengesController.addChallenge);

router.delete('/removeChallenge', challengesController.removeChallenge);

//! Remove in prod
router.get('/', challengesController.getChallenges);

module.exports = router;