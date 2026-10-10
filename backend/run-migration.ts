import "dotenv/config";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require", prepare: false });

try {
  console.log("Running migration...");
  await sql`
    CREATE TABLE IF NOT EXISTS "workspaces" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" varchar(100) NOT NULL,
      "owner_id" varchar(255) NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `;
  console.log("Migration executed successfully!");
  process.exit(0);
} catch (err) {
  console.error("Migration error:", err);
  process.exit(1);
}
