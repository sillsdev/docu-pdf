#!/usr/bin/env node

const chalk = require('chalk');
const pkg = require('../package.json');
import { program } from 'commander';

import { generatePDF, generatePDFOptions } from './utils';
import {
  commaSeparatedList,
  generatePuppeteerPDFMargin,
} from './commander-options';

console.log(`docu-pdf version ${pkg.version}`);

program
  .name('docu-pdf')
  .usage('urls [options]')
  .argument('<urls>', 'comma-separated urls to start generating PDF from')
  .showHelpAfterError(true)
  .option('--outputPath <filename>', 'path to the output PDF file', 'site.pdf')
  .option(
    '--excludeURLs <urls>',
    'URLs to be excluded in PDF. Comma separated.',
    commaSeparatedList,
    [],
  )
  .option(
    '--contentSelector <selector>',
    'CSS selector for the major sections. Default is `article`.',
    'article',
  )
  .option('--pageSize <format>', 'PDF page size ex: A3, A4...')
  .option(
    '--coverPath <string>',
    'file path to HTML snippet cover (see README)',
  )
  .option('--disableTOC', 'disable table of contents')
  .option(
    '--nextPageSelector <selector>',
    'CSS selector for the link to follow to the next section',
    'a.pagination-nav__link--next',
  )
  .option(
    '--tocLevel <number>',
    'The minimum header level to include in the table of contents. E.g. "1" (default), "2", or "3"',
    '1',
  )
  .option(
    '--excludeSelectors <selectors>',
    'CSS selector for HTML elements. E.g. .nav,.sidebar',
    commaSeparatedList,
    [],
  )
  .option(
    '--cssStyle <cssString>',
    'Apply to PDF output, e.g. body{padding-top: 0;} . Normally you would instead use @media print {...} in your Docusaurus custom.css',
  )
  .option(
    '--pdfMargin <margin>',
    'set margin around PDF file',
    generatePuppeteerPDFMargin,
  )
  .option('--headerTemplate <html>', 'html template for page header')
  .option('--footerTemplate <html>', 'html template for page footer')
  .option('--outline','include sidebar outline in PDF')
  .action((urls, options: generatePDFOptions) => {
    options.initialDocURLs = commaSeparatedList(urls);
    generatePDF(options)
      .then(() => {
        console.log(chalk.green('Done'));
        process.exit(0);
      })
      .catch((err: { stack: any }) => {
        console.error(chalk.red(err.stack));
        process.exit(1);
      });
  });
program.showHelpAfterError();
program.parse(process.argv);
