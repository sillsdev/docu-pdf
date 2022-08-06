#!/usr/bin/env node

const chalk = require('chalk');
import { Option, program } from 'commander';

import { generatePDF, generatePDFOptions } from './utils';
import {
  commaSeparatedList,
  generatePuppeteerPDFMargin,
} from './commander-options';

program
  .name('docu-pdf')
  .usage('<comma separated list of urls> [options]')
  .argument('<urls>', 'comma-separated urls to start generating PDF from')
  .option(
    '--excludeURLs <urls>',
    'urls to be excluded in PDF',
    commaSeparatedList,
    [],
  )
  .option(
    '--contentSelector <selector>',
    'used to find the part of main content',
    'article',
  )
  .option(
    '--nextPageSelector <selector>',
    'used to find next url',
    'a.pagination-nav__link--next',
  )
  .option(
    '--excludeSelectors <selectors>',
    'exclude selector ex: .nav',
    commaSeparatedList,
    ['.theme-doc-breadcrumbs,a.theme-edit-this-page'],
  )
  .option(
    '--cssStyle <cssString>',
    'css style to adjust PDF output ex: body{padding-top: 0;}',
  )
  .option('--outputPath <filename>', 'path to the output PDF file', 'site.pdf')
  .option(
    '--pdfMargin <margin>',
    'set margin around PDF file',
    generatePuppeteerPDFMargin,
  )
  .option('--pageSize <format>', 'pdf page size ex: A3, A4...')
  .option('--coverTitle <title>', 'title for PDF cover')
  .option('--coverImage <src>', 'image for PDF cover. *.svg file not working!')
  .option('--disableTOC', 'disable table of contents')
  .option('--coverSub <subtitle>', 'subtitle for PDF cover')
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
