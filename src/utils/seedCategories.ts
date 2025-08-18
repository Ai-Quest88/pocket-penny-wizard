import { supabase } from "@/integrations/supabase/client";

export const seedDefaultCategories = async () => {
  try {
    console.log('Seeding default categories from frontend...');
    const { data, error } = await supabase.rpc('seed_default_categories');
    
    if (error) {
      console.error('Error seeding categories:', error);
      return false;
    }
    
    console.log('Successfully seeded default categories');
    return true;
  } catch (error) {
    console.error('Error calling seed function:', error);
    return false;
  }
};