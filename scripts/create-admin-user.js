import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/market_sync',
});

async function createAdminUser() {
  try {
    const email = 'admin@inventoryhub.com';
    const password = 'admin123';
    const firstName = 'Admin';
    const lastName = 'User';

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert the admin user
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, first_name, last_name, role;
    `;

    const values = [email, passwordHash, firstName, lastName, 'admin'];
    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('👤 Role: admin');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();