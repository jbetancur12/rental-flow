import express from 'express';

const router = express.Router();

// Placeholder for webhook routes
router.post('/stripe', (req, res) => {
  res.json({ message: 'Stripe webhook - to be implemented' });
});

export default router;