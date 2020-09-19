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

  public HAS_EMAIL: boolean;
  public EMAIL_ENABLED: boolean;
  public EMAIL_HOST: string;
  public EMAIL_PORT: number;
  public EMAIL_UN: string;
  public EMAIL_PW: string;

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
    this.HOSTNAME = this.loadOrDefaultVariable('DOMAIN', `http://localhost:${this.PORT}`);

    this.DATABASE_NAME = this.loadVariable('DATABASE_NAME');
    this.DATABASE_USER = this.loadVariable('DATABASE_USER');
    this.DATABASE_PASSWORD = this.loadVariable('DATABASE_PASSWORD', true);
    this.DATABASE_HOST = this.loadVariable('DATABASE_HOST');
    this.DATABASE_PORT = Number.parseInt(this.loadVariable('DATABASE_PORT'), 10);
    this.SECRET = this.loadVariable('SECRET', true);
    this.SALT = Number.parseInt(this.loadVariable('SALT'), 10);
    this.TOKEN_LIFESPAN = this.loadNumberVariable('TOKEN_LIFESPAN');
    
    this.EMAIL_ENABLED = this.loadOrDefaultVariable('EMAIL_ENABLED', false, 'boolean');
    this.EMAIL_HOST = this.loadOptionalVariable('EMAIL_HOST', 'string');
    this.EMAIL_PORT = this.loadOptionalVariable('EMAIL_PORT', 'number');
    this.EMAIL_UN = this.loadOptionalVariable('EMAIL_UN', 'boolean', true);
    this.EMAIL_PW = this.loadOptionalVariable('EMAIL_PW', 'boolean', true);
    // =========================

    this.HAS_EMAIL = false;

    this.drawToConsole('');
  }

  private parseVariable(name: string, type: 'string' | 'boolean' | 'number' = 'string') {
    switch (type) {
      case 'string': return process.env[name];
      case 'number': return parseFloat(process.env[name]);
      case 'boolean':
        const isBoolString = ['true', 'false'].includes(process.env[name]);
        if (!isBoolString) return '';  
        return process.env[name] === 'true';
    }
  }

  private loadVariable(name: string, secret: boolean = false): string {
    const value: string = this.parseVariable(name, 'string') as string;

    if (!value) {
      this.drawToConsole(`  ${name}: !! ERROR !! - Required Variable not set`);
      process.exit(400);
    }

    this.drawToConsole(`  ${name}: ${secret ? 'set' : value}`);
    return value;
  }



  private loadOptionalVariable(name: string, type: 'string' | 'boolean' | 'number' = 'string', secret: boolean = false): any {
    const value: any = this.parseVariable(name, type);

    if (!value) {
      this.drawToConsole(`  ${name}: [optional variable not set]`);
      return '';
    }

    this.drawToConsole(`  ${name}: ${secret ? 'set' : value}`);
    return value;
  }

  private loadOrDefaultVariable(name: string, def: any, type: 'string' | 'boolean' | 'number' = 'string'): any {
    const value: any = this.parseVariable(name, type);

    if (!value) {
      this.drawToConsole(`  ${name}: ${def} [not set - using default]`);
      return def;
    }

    this.drawToConsole(`  ${name}: ${value}`);
    return value;
  }


  private loadNumberVariable(name: string, secret: boolean = false): number {
    const value: number = this.parseVariable(name, 'number') as number;

    if (isNaN(value)) {
      this.drawToConsole(`  ${name}: !! ERROR !! - Invalid Number Variable not set: ${value}`);
      process.exit(400);
    }

    this.drawToConsole(`  ${name}: ${secret ? 'set' : value}`);
    return value;
  }
}

export default new EnvironmentService();