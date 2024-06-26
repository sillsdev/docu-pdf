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
  waitForRender: number;
  headerTemplate: string;
  footerTemplate: string;
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
  coverPath,
  tocLevel,
  disableTOC,
  waitForRender,
  headerTemplate,
  footerTemplate,
}: generatePDFOptions): Promise<void> {
  let browser = await puppeteer.launch({
    args: [],
    // defaultViewport: null, // usefule when testing with headless-false
    // I'm going with "new" so as not to get surprises when the old is deprecated. Testing on a large site gave
    // somewhat less megs of PDF size, which could indicate a problem or just better compression.
    headless: 'new',
  });
  let page = await browser.newPage();

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

  console.log(chalk.cyan(`Scrolling and waiting to get all images to load...`));
  // These numbers, `delay`, `idleTime`, and `timeout` are all guesses.
  // They seem adequate for https://docs.bloomlibrary.org/ which is served from AWS S3
  // and has relatively large with lots of images.
  // If people have problems, we could think harder about them or make them parameters.
  await scrollPageToBottom(page as any, { delay: 100 });
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 60000 });
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
): Promise<string> {
  console.log(chalk.cyan(`Retrieving html from ${nextPageURL}`));

  await page.goto(`${nextPageURL}`, {
    waitUntil: 'networkidle0',
    timeout: 0,
  });

  // Get the HTML string of the content section.
  const html = await page.evaluate(
    ({ contentSelector }) => {
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

        let s = element.outerHTML;
        // remove loading="lazy" from images. Note in some tests this helped,
        // but still the scrolling was needed to get all images. So in the end this might not make a difference?
        s = s.replace(/loading\s*=\s*"lazy"/g, '');
        return s;
      } else {
        return '';
      }
    },
    { contentSelector },
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
