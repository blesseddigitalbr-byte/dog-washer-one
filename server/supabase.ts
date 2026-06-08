import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cdfjjhbczgyyogocioro.supabase.co";
const supabaseKey = "sb_publishable_NHeL-XBR5EqM_knll6rbdA_-8ABe57s";

export const supabase = createClient(supabaseUrl, supabaseKey);
