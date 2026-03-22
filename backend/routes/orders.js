import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Get orders (can filter by buyerId or status)
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('Order').select('*').order('created_at', { ascending: false });
    
    if (req.query.buyerId) {
      query = query.eq('buyerId', req.query.buyerId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create an order and decrement stock!
router.post('/', async (req, res) => {
  try {
    const { items, ...orderData } = req.body;
    
    // 1. Insert the new order
    const { data: orderResponse, error: orderError } = await supabase
      .from('Order')
      .insert([orderData])
      .select();
      
    if (orderError) throw orderError;
    
    // 2. Decrement the quantity for each purchased item
    if (items && Array.isArray(items)) {
      for (const item of items) {
        // Fetch current stock
        const { data: productData } = await supabase
          .from('Product')
          .select('quantityAvailable')
          .eq('id', item.id)
          .single();
          
        if (productData) {
          // Calculate new stock (preventing negatives)
          const newQty = Math.max(0, productData.quantityAvailable - item.quantity);
          
          // Update the database
          await supabase
            .from('Product')
            .update({ quantityAvailable: newQty })
            .eq('id', item.id);
        }
      }
    }

    res.status(201).json(orderResponse[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
