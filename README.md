## ℹ️ Note

This is a fork of the much appreciated [mr-pdf](https://github.com/kohheepeace/mr-pdf). Our fork is just to ease maintenance for use with our Docusaurus sites, not the other systems that mr-pdf supports.

## About docu-pdf

This is a command line tool for creating PDFs from documentation sites built with [Docusaurus](https://docusaurus.io). While your browser can make pdfs of individual pages, this makes one of _all_ the pages.

## Usage

```shell
npx docu-pdf https://docs.bloomlibrary.org/
```

## CLI Options

| Option               | Required | Description                                                                                                                                                                        |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| main argument        | Yes      | a comma-separated list of URLs to start generating PDF from.                                                                                                                       |
| `--contentSelector`  | No       | used to find the part of main content                                                                                                                                              |
| `--nextPageSelector` | No       | CSS Selector for the link that takes you to the next page.                                                                                                                         |
| `--excludeURLs`      | No       | URLs to be excluded in PDF                                                                                                                                                         |
| `--excludeSelectors` | No       | exclude selectors from PDF. Separate each selector **with comma and no space**. But you can use space in each selector. ex: `--excludeSelectors=".nav,.next > a"`                  |
| `--cssStyle`         | No       | CSS style to adjust PDF output ex: `--cssStyle="body{padding-top: 0;}"` \*If you're project owner you can use `@media print { }` to edit CSS for PDF.                              |
| `--outputPath`       | No       | path to output PDF file. Default is `site.pdf`                                                                                                                                     |
| `--pdfMargin`        | No       | set margin around PDF file. Separate each margin **with comma and no space**. ex: `--pdfMargin="10,20,30,40"`. This sets margin `top: 10px, right: 20px, bottom: 30px, left: 40px` |
| `--pageSize`         | No       | pdf format ex: `--pageSize="A3"`. Please check this link for available formats [Puppeteer document](https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-pagepdfoptions)   |
| `--disableTOC`       | No       | Optional toggle to show the table of contents or not                                                                                                                               |
| `--coverPath`        | No       | path to custom HTML file for cover. Top level should be like `<div style="page-break-after:always"></div>`.                                                                        |
| `--headerTemplate`   | No       | HTML template for the print header. Please check this link for details of injecting values [Puppeteer document](https://pptr.dev/#?product=Puppeteer&show=api-pagepdfoptions)      |
| `--footerTemplate`   | No       | HTML template for the print footer. Please check this link for details of injecting values [Puppeteer document](https://pptr.dev/#?product=Puppeteer&show=api-pagepdfoptions)      |
|                      |          |                                                                                                                                                                                    |
