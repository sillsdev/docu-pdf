const chalk = require('chalk');
import * as fs from 'fs';
import puppeteer = require('puppeteer');
import { scrollPageToBottom } from 'puppeteer-autoscroll-down';

let contentHTML = '';
export type generatePDFOptions = {
  initialDocURLs: Array<string>;
  excludeURLs: Array<string>;
  outputPath: string;
  pdfMargin: puppeteer.PDFOptions['margin'];
  contentSelector: string;
  nextPageSelector: string;
  pageSize: puppeteer.PaperFormat;
  excludeSelectors: Array<string>;
  cssStyle: string;
  puppeteerArgs: Array<string>;
  coverPath: string;
  tocLevel: number;
  disableTOC: boolean;
  protocolTimeoutMs?: number;
  scrollDelayMs?: number;
  scrollSizePx?: number;
  scrollStepsLimit?: number;
  headerTemplate: string;
  footerTemplate: string;
  outline: boolean;
  baseUrlForLinks: string;
};

export async function generatePDF({
  initialDocURLs,
  excludeURLs,
  outputPath,
  pdfMargin = { top: 32, right: 32, bottom: 32, left: 32 },
  contentSelector,
  nextPageSelector,
  pageSize,
  excludeSelectors,
  cssStyle,
  puppeteerArgs,
  coverPath,
  tocLevel,
  disableTOC,
  protocolTimeoutMs,
  scrollDelayMs,
  scrollSizePx,
  scrollStepsLimit,
  headerTemplate,
  footerTemplate,
  outline,
  baseUrlForLinks,
}: generatePDFOptions): Promise<void> {
  const protocolTimeout = protocolTimeoutMs ?? 300000;

  const browser = await puppeteer.launch({
    args: puppeteerArgs ?? [],
    protocolTimeout,
    // defaultViewport: null, // useful when testing with headless: false
    // headless: false,
  });
  const page = await browser.newPage();

  if (coverPath?.length > 0 && !fs.existsSync(coverPath)) {
    throw console.error(chalk.red(`Could not find coverPath "${coverPath}"`));
  }

  for (const url of initialDocURLs) {
    let nextPageURL = url;
    let index = 0;
    // Create a list of HTML for the content section of all pages by looping
    while (nextPageURL) {
      ++index;
      nextPageURL = await doOnePage(
        page,
        nextPageURL,
        contentSelector,
        nextPageSelector,
        excludeURLs,
        baseUrlForLinks,
      );
    }
  }

  let coverHTML = '';
  if (coverPath) {
    coverHTML = fs.readFileSync(coverPath, 'utf8');
  } else {
    coverHTML = `
  <div
    class="pdf-cover"
    style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      page-break-after: always;
      text-align: center;
    "
  >
    <h1>${initialDocURLs
      .map((url) => url.replace('https://', ''))
      .join(' ')}</h1>
  </div>`;
  }

  // Add Toc
  const { modifiedContentHTML, tocHTML } = generateToc(contentHTML, tocLevel);

  // Restructuring the html of a document
  await page.evaluate(
    ({ coverHTML, tocHTML, modifiedContentHTML, disableTOC }) => {
      // Empty body content
      const body = document.body;
      body.innerHTML = '';

      // Add Cover
      body.innerHTML += coverHTML;

      // Add toc
      if (!disableTOC) body.innerHTML += tocHTML;

      // Add body content
      body.innerHTML += modifiedContentHTML;
    },
    { coverHTML, tocHTML, modifiedContentHTML, disableTOC },
  );

  // Remove unnecessary HTML by using excludeSelectors
  if (outline) {
    //remove nav links to prevent name duplication in outline
    excludeSelectors.push('.breadcrumbs__link,.breadcrumbs__item,.hash_link');
  } else {
    //default selectors to remove
    excludeSelectors.push('.theme-doc-breadcrumbs,a.theme-edit-this-page');
  }
  excludeSelectors &&
    excludeSelectors.map(async (excludeSelector) => {
      // "selector" is equal to "excludeSelector"
      // https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-pageevaluatepagefunction-args
      await page.evaluate((selector) => {
        const matches = document.querySelectorAll(selector);
        matches.forEach((match) => match.remove());
      }, excludeSelector);
    });

  // Add a custom CSS rule from command line option. We (Bloom-docs) don't use this, so it doesn't get much testing.
  if (cssStyle) {
    await page.addStyleTag({ content: cssStyle });
  }

  //await sleep(20); //use this when debugging with headless=false

  const isLocalhost = initialDocURLs.some(
    (url) =>
      url.includes('localhost') ||
      url.includes('127.0.0.1') ||
      url.includes('0.0.0.0'),
  );

  const scrollDelayMsToUse = scrollDelayMs ?? (isLocalhost ? 50 : 100);
  const scrollSizePxToUse = scrollSizePx ?? (isLocalhost ? 400 : 250);
  const scrollStepsLimitToUse =
    scrollStepsLimit ?? (isLocalhost ? 200 : undefined);
  console.log(chalk.cyan(`Scrolling and waiting to get all images to load...`));
  console.log(
    chalk.gray(
      `scrollSizePx: ${scrollSizePxToUse}, scrollDelayMs: ${scrollDelayMsToUse}, scrollStepsLimit: ${scrollStepsLimitToUse}`,
    ),
  );
  // Scroll settings are configurable from CLI.
  try {
    await scrollPageToBottom(page as any, {
      size: scrollSizePxToUse,
      delay: scrollDelayMsToUse,
      stepsLimit: scrollStepsLimitToUse,
    });
  } catch (error) {
    if (isProtocolTimeoutError(error)) {
      console.log(
        chalk.red(
          `Auto-scroll timed out at protocol layer. Adjust --scrollSizePx/--scrollDelayMs/--scrollStepsLimit and retry.`,
        ),
      );
    }

    throw error;
  }

  if (isLocalhost) {
    // Often dev servers never become truly idle.
    // Besides, when serving locally, it should be fast anyway.
    const localhostWaitSeconds = 10;
    console.log(
      chalk.yellow(
        `Detected localhost - waiting ${localhostWaitSeconds} seconds for all resources to load...`,
      ),
    );
    await sleep(localhostWaitSeconds);
  } else {
    console.log(chalk.yellow(`Waiting for network to become idle...`));
    await page.waitForNetworkIdle({ idleTime: 1000, timeout: 300000 });
  }

  console.log(chalk.cyan(`Creating PDF at ${outputPath}`));
  await page.pdf({
    path: outputPath,
    format: pageSize,
    printBackground: true,
    margin: pdfMargin,
    displayHeaderFooter: !!(headerTemplate || footerTemplate),
    headerTemplate,
    footerTemplate,
    timeout: 0,
    outline: outline,
  });
}

function generateToc(contentHtml: string, tocLevel: number) {
  const headers: Array<{
    header: string;
    level: number;
    id: string;
  }> = [];

  // Create TOC down to specified header level
  const re = new RegExp(`<h[1-${tocLevel}](.+?)</h[1-${tocLevel}]( )*>`, 'g');
  const modifiedContentHTML = contentHtml.replace(re, htmlReplacer);

  function htmlReplacer(matchedStr: string) {
    // docusaurus inserts #s into headers for direct links to the header
    const headerText = matchedStr
      .replace(/<a[^>]*>#<\/a( )*>/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    const headerId = `${Math.random().toString(36).substr(2, 5)}-${
      headers.length
    }`;

    // level is h<level>
    const level = Number(matchedStr[matchedStr.indexOf('h') + 1]);

    headers.push({
      header: headerText,
      level,
      id: headerId,
    });

    const modifiedContentHTML = matchedStr.replace(/<h[1-3].*?>/g, (header) => {
      if (header.match(/id( )*=( )*"/g)) {
        return header.replace(/id( )*=( )*"/g, `id="${headerId} `);
      } else {
        return header.substring(0, header.length - 1) + ` id="${headerId}">`;
      }
    });

    return modifiedContentHTML;
  }

  const toc = headers
    .map(
      (header) =>
        `<li class="toc-item toc-item-${header.level}" style="margin-left:${
          (header.level - 1) * 20
        }px"><a href="#${header.id}">${header.header}</a></li>`,
    )
    .join('\n');

  const tocHTML = `
  <div class="toc-page" style="page-break-after: always;">
    <h1 class="toc-header">Table of contents:</h1>
    <ul class="toc-list">${toc}</ul>
  </div>
  `;

  return { modifiedContentHTML, tocHTML };
}

async function doOnePage(
  page: puppeteer.Page,
  nextPageURL: string,
  contentSelector: string,
  nextPageSelector: string,
  excludeURLs: string[],
  baseUrlForLinks: string,
): Promise<string> {
  console.log(chalk.cyan(`Retrieving html from ${nextPageURL}`));

  await page.goto(`${nextPageURL}`, {
    waitUntil: 'networkidle0',
    timeout: 0,
  });

  // Get the HTML string of the content section.
  const html = await page.evaluate(
    ({ contentSelector, baseUrlForLinks }) => {
      const element: HTMLElement | null =
        document.querySelector(contentSelector);
      if (element) {
        // Add pageBreak for PDF
        element.style.pageBreakAfter = 'always';

        // Open <details> tag
        const detailsArray = element.getElementsByTagName('details');
        Array.from(detailsArray).forEach((element) => {
          element.open = true;
        });

        if (baseUrlForLinks && baseUrlForLinks.length > 0) {
          // Replace absolute path links (starting with /) with full URLs

          const baseUrl = baseUrlForLinks.endsWith('/')
            ? baseUrlForLinks.slice(0, -1)
            : baseUrlForLinks;

          const links = element.getElementsByTagName('a');
          Array.from(links).forEach((link) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('/')) {
              link.setAttribute('href', `${baseUrl}${href}`);
            }
          });
        }

        let s = element.outerHTML;
        // remove loading="lazy" from images. Note in some tests this helped,
        // but still the scrolling was needed to get all images. So in the end this might not make a difference?
        s = s.replace(/loading\s*=\s*"lazy"/g, '');
        return s;
      } else {
        return '';
      }
    },
    { contentSelector, baseUrlForLinks },
  );

  // Make joined content html
  if (excludeURLs && excludeURLs.includes(nextPageURL)) {
    console.log(chalk.green('This URL is excluded.'));
  } else {
    contentHTML += html;
  }

  // return the url of the next page (normally, by looking at the footer of the page)
  return await page.evaluate((nextPageSelector) => {
    const element = document.querySelector(nextPageSelector);
    if (element) {
      return (element as HTMLLinkElement).href;
    } else {
      return '';
    }
  }, nextPageSelector);
}

async function sleep(seconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000 * seconds);
  });
}

function isProtocolTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { message?: unknown; name?: unknown };
  const message =
    typeof maybeError.message === 'string' ? maybeError.message : '';
  const name = typeof maybeError.name === 'string' ? maybeError.name : '';

  return (
    name.includes('ProtocolError') &&
    message.includes('Runtime.callFunctionOn timed out')
  );
}
