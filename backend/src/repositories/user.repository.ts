import { supabase } from '../config/supabase';

/**
 * User Repository
 * Isolates all database operations related to the `users` table.
 */
export class UserRepository {
  static async createUser(email: string) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ email }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  }
}
