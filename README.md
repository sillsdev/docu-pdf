## ℹ️ Note

This is a fork of the much appreciated [mr-pdf](https://github.com/kohheepeace/mr-pdf). Our fork is just to ease maintenance for use with our Docusaurus sites, not the other systems that mr-pdf supports.

## About docu-pdf

This is a command line tool for creating PDFs from documentation sites built with [Docusaurus](https://docusaurus.io). While your browser can make pdfs of individual pages, this makes one of _all_ the pages.

## Usage

```shell
npx docu-pdf https://docs.bloomlibrary.org/
```

## CLI Options

| Option             | Required | Description                                                                                                                                                                       |
| ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| main argument      | Yes      | The root of your documentation. If you need multiple root urls, separate with commas.                                                                                             |
| `--outputPath`     | No       | path to output PDF file. Default is `site.pdf`                                                                                                                                    |
| `--pageSize`       | No       | pdf format e.g. `--pageSize="A3"`. Please check this link for available formats [Puppeteer document](https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-pagepdfoptions) |
| `--coverPath`      | No       | file path to custom HTML file for cover. Top level should be like `<div style="page-break-after:always"></div>`.                                                                  |
| `--disableTOC`     | No       | Omit the table of contents                                                                                                                                                        |
| `--headerTemplate` | No       | HTML template for the print header. [More info](https://pptr.dev/api/puppeteer.pdfoptions.headertemplate)                                                                         |
| `--footerTemplate` | No       | HTML template for the print footer. [More info](https://pptr.dev/api/puppeteer.pdfoptions.footertemplate/)                                                                        |

<details>
  <summary>More options</summary>

| Option               | Required | Description                                                                                                                                                                                             |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--contentSelector`  | No       | CSS selector for the major sections. Default is `article`.                                                                                                                                              |
| `--nextPageSelector` | No       | CSS selector for the link to follow to the next section                                                                                                                                                 |
| `--excludeURLs`      | No       | URLs to be excluded in PDF. Comma separated.                                                                                                                                                            |
| `--excludeSelectors` | No       | CSS selector for HTML elements to omit from PDF. E.g. .nav,.sidebar. Separate each selector **with comma and no space**. You can use space in each selector. e.g. `--excludeSelectors=".nav,.next > a"` |
| `--cssStyle`         | No       | CSS style to adjust PDF output. E.g. `--cssStyle="body{padding-top: 0;}"` \*If you're project owner you can use `@media print { }` to edit CSS for PDF.                                                 |
| `--pdfMargin`        | No       | set margin around PDF file. Separate each margin **with comma and no space**. E.g. `--pdfMargin="10,20,30,40"`. This sets margin `top: 10px, right: 20px, bottom: 30px, left: 40px`                     |

</details>
