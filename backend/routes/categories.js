import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('Category').select('*');
    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
