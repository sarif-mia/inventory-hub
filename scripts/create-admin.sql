-- Create admin user with password 'admin123'
-- Password hash for 'admin123' using bcrypt with 10 salt rounds
INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
VALUES (
  'admin@inventoryhub.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 'admin123'
  'Admin',
  'User',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;