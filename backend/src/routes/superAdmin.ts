import express from 'express';

const router = express.Router();

// Placeholder for super admin routes
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Super admin dashboard - to be implemented' });
});

export default router;