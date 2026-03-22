import { supabase } from './backend/supabaseClient.js';
console.log("Checking Supabase Connection...");
console.log("Configured URL:", supabase.supabaseUrl);

async function test() {
  try {
    const { data, error } = await supabase.from('Category').select('*');
    if (error) {
      console.log("----- RAW ERROR LOG -----");
      console.log(JSON.stringify(error, null, 2));
      console.log(error);
    } else {
      console.log("----- RAW DATA LOG -----");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log("CATCH BLOCK ERROR:", err.message);
  }
}
test();
