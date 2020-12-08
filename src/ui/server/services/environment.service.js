const dotenv = require('dotenv');

class Environment {

  constructor() { this.loadEnvironment(); }

  loadEnvironment() {
    dotenv.config();

    console.log('=== Environment Variables ===\n');
    // Global
    this.NODE_ENV = this.loadVariable('NODE_ENV');
    this.CWD = process.cwd();
    this.PORT = this.loadVariable('PORT');
    this.HOST = this.loadOptionalVariable('HOST', '127.0.0.1');
    this.DIST_DIR = this.loadVariable('DIST_DIR');

    this.SERVER_URL = this.loadVariable('SERVER_URL')

    if (this.NODE_ENV === 'development') {
      this.loadDevelopmentEnvironment();
    } else {
      this.loadProductionEnvironment();
    }

    console.log('\n=============================\n');
  };

  loadDevelopmentEnvironment() {
    console.log('\n--- Development Variables ---');

    // Add development only variables here
  }

  loadProductionEnvironment() {
    console.log('\n--- Production Variables ---');

    // Add production only variables here
  }

  loadVariable(name) {
    const value = process.env[name];

    if (!value) {
      console.log(`  ${name}: !! ERROR !! - Required Variable not set`);
      process.exit(400);
    }

    console.log(`  ${name}: ${value}`);
    return value;
  }

  loadSecretVariable(name) {
    const value = process.env[name];

    if (!value) {
      console.log(`  ${name}: !! ERROR !! - Required Variable not set`);
      process.exit(400);
    }

    console.log(`  ${name}: set`);
    return value;
  }

  loadOptionalVariable(name, defaultValue) {
    const value = process.env[name];

    if (!value) {
        console.log(`  ${name}: [optional variable not set]`);
        return defaultValue;
    }

    console.log(`  ${name}: ${value}`);
    return value;
  }

  checkSecretVariable(name) {
      const value = process.env[name];

      if (!value) {
          console.error(`  !! ERROR !! - Required variable of "${name}" is not set!`);
          process.exit(400);
      }
      console.log(`  ${name}: SET`);
  }
}

module.exports = new Environment();
