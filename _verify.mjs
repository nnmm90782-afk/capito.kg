import pkg from "pg";
import fs from "fs";
const { Pool } = pkg;
const url = fs.readFileSync(".env","utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
const cat = await pool.query("SELECT id FROM categories WHERE slug='coffee'");
await pool.query(
  "INSERT INTO products (category_id,name,slug,description,price,badge,is_active) VALUES($1,$2,$3,$4,$5,$6,true)",
  [cat.rows[0].id, "Тест Латте", "test-latte-"+Date.now(), "Тестовый товар для проверки", 300, "Новинка"]
);
console.log("✓ Inserted Тест Латте");
await pool.end();
