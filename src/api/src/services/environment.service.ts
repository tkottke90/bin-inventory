import dotenv from 'dotenv';

class EnvironmentService {
  public CWD: string;
  public ENVIRONMENT: string;
  public IS_DEVELOPMENT: boolean;
  public PORT: string;

  // == Add Class Properties Here ==
  public HOSTNAME: string;

  public DATABASE_NAME: string;
  public DATABASE_USER: string;
  public DATABASE_PASSWORD: string;
  public DATABASE_HOST: string;
  public DATABASE_PORT: number;
  public SECRET: string;
  public SALT: number;
  public TOKEN_LIFESPAN: number;

  public HIDE_ENV: string;
  // ===============================

  constructor() {
    dotenv.config();
    this.loadVariables();
  }

  private loadVariables() {
    this.drawToConsole('=== Environment Variables ===\n');
    // Global Variables
    this.loadGlobalVariables();
    // Check if Production
    if (this.IS_DEVELOPMENT) {
      this.loadDevelopmentEnvironment();
    } else {
      this.loadProductionEnvironment();
    }

    this.drawToConsole('\n=============================\n');
  }

  private drawToConsole(output: string) {
    if (process.env.HIDE_ENV !== 'true') {
      console.log(output);
    }
  }

  private loadDevelopmentEnvironment() {
    this.drawToConsole('--- Development Variables ---');
    this.HIDE_ENV = this.loadOptionalVariable('HIDE_ENV');
  }

  private loadProductionEnvironment() {
    this.drawToConsole('--- Production Variables ---');
  }

  private loadGlobalVariables() {
    this.drawToConsole('--- Required Always -- ');

    this.ENVIRONMENT = this.loadVariable('NODE_ENV');
    this.PORT = this.loadVariable('PORT');
    this.CWD = process.cwd();
    this.IS_DEVELOPMENT = this.ENVIRONMENT === 'development';

    // == Load Variables Here ==
    this.HOSTNAME = this.loadOrDefaultVariable('DOMAIN', `http://localhost:${__dirname}`);

    this.DATABASE_NAME = this.loadVariable('DATABASE_NAME');
    this.DATABASE_USER = this.loadVariable('DATABASE_USER');
    this.DATABASE_PASSWORD = this.loadSecretVariable('DATABASE_PASSWORD');
    this.DATABASE_HOST = this.loadVariable('DATABASE_HOST');
    this.DATABASE_PORT = Number.parseInt(this.loadVariable('DATABASE_PORT'), 10);
    this.SECRET = this.loadSecretVariable('SECRET');
    this.SALT = Number.parseInt(this.loadVariable('SALT'), 10);
    this.TOKEN_LIFESPAN = this.loadNumberVariable('TOKEN_LIFESPAN');
    // =========================

    this.drawToConsole('');
  }

  private loadVariable(name: string): string {
    const value: string = process.env[name];

    if (!value) {
      this.drawToConsole(`  ${name}: !! ERROR !! - Required Variable not set`);
      process.exit(400);
    }

    this.drawToConsole(`  ${name}: ${value}`);
    return value;
  }

  private loadSecretVariable(name: string): string {
    const value: string = process.env[name];

    if (!value) {
      this.drawToConsole(`  ${name}: !! ERROR !! - Required Variable not set`);
      process.exit(400);
    }

    this.drawToConsole(`  ${name}: set`);
    return value;
  }

  private loadOptionalVariable(name: string): string {
    const value: string = process.env[name];

    if (!value) {
      this.drawToConsole(`  ${name}: [optional variable not set]`);
      return '';
    }

    this.drawToConsole(`  ${name}: ${value}`);
    return value;
  }

  private loadOrDefaultVariable(name: string, def: any): string {
    const value: string = process.env[name];

    if (!value) {
      this.drawToConsole(`  ${name}: ${def} [not set - using default]`);
      return def;
    }

    this.drawToConsole(`  ${name}: ${value}`);
    return value;
  }

  private loadBooleanVariable(name: string): boolean {
    const value: boolean = process.env[name] === 'true';

    if (!value) {
      this.drawToConsole(`  ${name}: !! ERROR !! - Invalid Boolean Variable not set`);
      process.exit(400);
    }

    this.drawToConsole(`  ${name}: ${value}`);
    return value;
  }

  private loadNumberVariable(name: string): number {
    const value: number = parseFloat(process.env[name]);

    if (isNaN(value)) {
      this.drawToConsole(`  ${name}: !! ERROR !! - Invalid Number Variable not set: ${value}`);
      process.exit(400);
    }

    this.drawToConsole(`  ${name}: ${value}`);
    return value;
  }
}

export default new EnvironmentService();