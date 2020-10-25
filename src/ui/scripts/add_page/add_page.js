#! /usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const inquirer = require('inquirer');
inquirer.registerPrompt('directory', require('inquirer-select-directory'));

var figlet = require('figlet');

const package = require('../package.json');

const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

//#region Variables
program
  .version(package.version)
  .option('-d, --dry-run', 'Run through script without making any changes')
  .option('-p, --package <package>', 'Location of package.json for project', '../../package.json');

program.parse(process.argv);

const defaultConfig = {
  pages: [ 'src', 'app', 'pages' ]
}
// #endregion

async function main() {
  // Get configuration from project package.json
  const packageLocation = path.resolve(__dirname, program.package)
  const pkgExists = await exists(packageLocation);
  if (!pkgExists) {
    console.error('Missing package.json at: ../../package.json');
    process.exit(1);
  }

  // Get tag path
  const responses = await inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Directory location:',
      suffix: ' (relative to src/app/pages)'
    },
    {
      type: 'input',
      name: 'tag',
      message: 'HTML Tag:',
      validate: (input) => {
        const valid = /\w+[-]\w+/.test(input);

        if (!valid) {
          return `Custom element tags must contain hyphen: example-component`
        }

        return true;
      }
    },
    {
      type: 'input',
      name: 'class',
      message: 'Page Class Name:',
      default: (current) => {
        const defaultClass = current
                                .tag
                                .split('-')
                                .map((item) => {
                                  return `${item.slice(0, 1).toUpperCase()}${item.slice(1)}`;
                                }).join('');

        return defaultClass;
      }
    },
    {
      type: 'confirm',
      name: 'rxjs',
      message: 'Will you use fromEvent (RXJS) in this page?'
    }
  ]);

  // Get project package.json
  const projectPackage = require(program.package);
  // Check for configuration called 'uff'
  const config = projectPackage.uff || defaultConfig;
  
  // Check if path exists, and warn user if it does
  const dirExists = false;

  // Create Directory

  // Write template

  // Create css module

  console.dir(responses);
}

main();