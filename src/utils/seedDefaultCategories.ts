import { supabase } from '@/integrations/supabase/client';

export const seedDefaultCategories = async (userId: string) => {
  console.log('Seeding default categories for user:', userId);
  
  try {
    // Create default category groups
    const defaultGroups = [
      { name: 'Income', category_type: 'income', icon: '💰', description: 'Money coming in' },
      { name: 'Expenses', category_type: 'expense', icon: '💸', description: 'Money going out' },
      { name: 'Transfers', category_type: 'transfer', icon: '🔄', description: 'Money moving between accounts' }
    ];

    const { data: groups, error: groupError } = await supabase
      .from('category_groups')
      .insert(defaultGroups.map(group => ({ ...group, user_id: userId })))
      .select();

    if (groupError) throw groupError;

    // Create default buckets and categories
    const incomeGroup = groups.find(g => g.category_type === 'income');
    const expenseGroup = groups.find(g => g.category_type === 'expense');
    const transferGroup = groups.find(g => g.category_type === 'transfer');

    const defaultBuckets = [
      { name: 'Salary & Wages', group_id: incomeGroup?.id, icon: '💼' },
      { name: 'Food & Dining', group_id: expenseGroup?.id, icon: '🍽️' },
      { name: 'Transportation', group_id: expenseGroup?.id, icon: '🚗' },
      { name: 'Transfers', group_id: transferGroup?.id, icon: '🔄' }
    ];

    const { data: buckets, error: bucketError } = await supabase
      .from('category_buckets')
      .insert(defaultBuckets.map(bucket => ({ ...bucket, user_id: userId })))
      .select();

    if (bucketError) throw bucketError;

    // Create default categories
    const salaryBucket = buckets.find(b => b.name === 'Salary & Wages');
    const foodBucket = buckets.find(b => b.name === 'Food & Dining');
    const transportBucket = buckets.find(b => b.name === 'Transportation');
    const transferBucket = buckets.find(b => b.name === 'Transfers');

    const defaultCategories = [
      { name: 'Salary', bucket_id: salaryBucket?.id },
      { name: 'Groceries', bucket_id: foodBucket?.id },
      { name: 'Restaurants', bucket_id: foodBucket?.id },
      { name: 'Gas & Fuel', bucket_id: transportBucket?.id },
      { name: 'Public Transport', bucket_id: transportBucket?.id },
      { name: 'Transfer In', bucket_id: transferBucket?.id },
      { name: 'Transfer Out', bucket_id: transferBucket?.id }
    ];

    const { error: categoryError } = await supabase
      .from('categories')
      .insert(defaultCategories.map(category => ({ ...category, user_id: userId })));

    if (categoryError) throw categoryError;

    console.log('Successfully seeded default categories');
    return true;
  } catch (error) {
    console.error('Error seeding default categories:', error);
    throw error;
  }
};