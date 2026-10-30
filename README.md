# itrfeed

A simple tool which converts the Latest News from the Indian
[Income Tax e-Filing portal](https://www.incometax.gov.in/iec/foportal/latest-news)
into an RSS (atom) feed which can then be used in various integrations (like
feed readers, bots)

Feed URL (refreshed every 6 hours):
https://ibrahimshaik5403-ui.github.io/cbic-tax-intelligence-feed/feed.xml

# How it works

The Income Tax portal has no JSON endpoint (unlike the GST portal), so the
script downloads the server-rendered
[Latest News](https://www.incometax.gov.in/iec/foportal/latest-news) page, finds
every news entry by its date label (e.g. `12-Oct-2026`) and turns each one into
a feed item. The first "Click here" link (usually the notification / circular
PDF) becomes the item link. The first `PAGES` pages (10 items each, set in
`main.ts`) are included.

# Installation

## Build Requirements

- [Deno](https://deno.com)

## Usage

To run the script:

```
deno task run
```

This will generate the `feed.xml` in the same directory which can be copied to
any location of choice.

The script optionally accepts custom path to the feed file as first argument

```
deno task run /path/to/feed.xml
```

To compile as binary:

```
deno task build
```

For development:

```
deno task dev
```

# Publishing with GitHub Pages

1. Push this repo to GitHub (default branch `master`, or edit the branch names
   in `.github/workflows/build.yml`).
2. In the repo go to **Settings → Pages → Build and deployment → Source** and
   choose **GitHub Actions**.
3. Run the **Refresh Feed** workflow once from the **Actions** tab (it then runs
   automatically at 00:00 and 12:00 UTC).

# License

This script is licensed under the GNU `GPLv3`
