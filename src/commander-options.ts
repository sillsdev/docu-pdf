import puppeteer = require('puppeteer');

export function commaSeparatedList(
  value: string,
  dummyPrevious?: any,
): Array<string> {
  return value.split(',');
}

export function generatePuppeteerPDFMargin(
  value: string,
  dummyPrevious: any,
): puppeteer.PDFOptions['margin'] {
  const marginStrings = value.split(',');

  const marginTop = marginStrings[0];
  const marginRight = marginStrings[1];
  const marginBottom = marginStrings[2];
  const marginLeft = marginStrings[3];

  const generatedMargins = {
    top: marginTop,
    right: marginRight,
    bottom: marginBottom,
    left: marginLeft,
  };

  return generatedMargins;
}

export function parseNumber(value: string): number {
  if (value.trim() === '') {
    throw new Error(`Expected a number but got "${value}"`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected a number but got "${value}"`);
  }

  return parsed;
}
