
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
    throw new Error("Supabase environment variables are missing");
}

export const supabase = createClient(url, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
