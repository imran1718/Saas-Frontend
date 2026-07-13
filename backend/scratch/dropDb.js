const sequelize = require('../src/config/db.config');

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB. Wiping public schema...');
    await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Public schema wiped and recreated successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

run();
