const dotenv = require('dotenv');
dotenv.config();

const db = require('../config/database');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  try {
    console.log('Seeding demo users...');

    // Demo users
    const users = [
      {
        full_name: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      },
      {
        full_name: 'Editor User',
        username: 'editor',
        email: 'editor@example.com',
        password: 'password123',
        role: 'editor',
      },
      {
        full_name: 'Viewer User',
        username: 'viewer',
        email: 'viewer@example.com',
        password: 'password123',
        role: 'viewer',
      },
    ];

    for (const user of users) {
      // Check if user already exists
      const existing = await db.query('SELECT id FROM users WHERE username = $1 OR email = $2', [
        user.username,
        user.email,
      ]);

      if (existing.rows.length === 0) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        await db.query(
          'INSERT INTO users (full_name, username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
          [user.full_name, user.username, user.email, passwordHash, user.role, true]
        );
        console.log(`✓ Created user: ${user.username} (${user.role})`);
      } else {
        console.log(`✓ User already exists: ${user.username}`);
      }
    }

    console.log('✓ Demo users seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
