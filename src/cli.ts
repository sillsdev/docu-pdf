#!/usr/bin/env node

const chalk = require('chalk');
import { program } from 'commander';

import { generatePDF, generatePDFOptions } from './utils';
import {
  commaSeparatedList,
  generatePuppeteerPDFMargin,
} from './commander-options';

program
  .name('docu-pdf')
  .usage('<comma separated list of urls> [options]')
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
    '--excludeSelectors <selectors>',
    'CSS selector for HTML elements. E.g. .nav,.sidebar',
    commaSeparatedList,
    ['.theme-doc-breadcrumbs,a.theme-edit-this-page'],
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
  .option('--waitForRender <timeout>', 'wait for document render')
  .option('--headerTemplate <html>', 'html template for page header')
  .option('--footerTemplate <html>', 'html template for page footer')
  .action((urls, options: generatePDFOptions) => {
    options.initialDocURLs = commaSeparatedList(urls);
    generatePDF(options)
      .then(() => {
        console.log(chalk.green('Finish generating PDF!'));
        process.exit(0);
      })
      .catch((err: { stack: any }) => {
        console.error(chalk.red(err.stack));
        process.exit(1);
      });
  });

program.parse(process.argv);
