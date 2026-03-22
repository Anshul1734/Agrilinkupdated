import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('Product').select('*');
    
    if (req.query.categoryId) {
      query = query.eq('categoryId', req.query.categoryId);
    }
    if (req.query.search) {
      query = query.ilike('name', `%${req.query.search}%`);
    }
    if (req.query.sellerId) {
      query = query.eq('sellerId', req.query.sellerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single product
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new product (Farmer)
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Product')
      .insert([req.body])
      .select();
      
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock
router.put('/:id/stock', async (req, res) => {
  try {
    const { quantityAvailable, inStock } = req.body;
    const { data, error } = await supabase
      .from('Product')
      .update({ quantityAvailable, inStock })
      .eq('id', req.params.id)
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
