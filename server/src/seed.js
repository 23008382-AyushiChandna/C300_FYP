require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User } = require('./models');

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    const email = 'ayushichandna30@gmail.com';
    const password = 'Spongebob67';
    const companyName = 'Ayushi Chandna';
    
    // Delete existing user if any
    await User.destroy({ where: { email } });
    console.log('Deleted any existing user with email:', email);
    
    // Create fresh user with properly hashed password
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
    
    const user = await User.create({ email, passwordHash: hash, companyName });
    console.log('Created new user:', email);
    console.log('User ID:', user.id);
    process.exit(0);
  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
}

run();
