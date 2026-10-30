// CBIC Tax Information Portal API to Atom RSS Feed
// License: GPLv3

import { Atom } from "@feed/feed";
import { fetchCBICUpdates } from "./cbic client.ts";
import { type NewsItem, parseCBICUpdates } from "./cbic-parser.ts";

const NEWS_URL = "https://taxinformation.cbic.gov.in/";

let fileName = "feed.xml";

const atomFeed = new Atom({
  title: "CBIC Tax Information Portal Updates",

  description: "Latest GST, Customs, Central Excise and CBIC notifications",

  link: NEWS_URL,

  authors: [
    {
      name: "Central Board of Indirect Taxes and Customs",
      email: "cbic@example.org",
    },
  ],

  updated: new Date(),

  id: NEWS_URL,
});

async function fetchCBICNews(): Promise<NewsItem[]> {
  console.info(
    "Fetching news from CBIC portal",
  );

  try {
    const data = await fetchCBICUpdates();

    const items = parseCBICUpdates(data);

    return items;
  } catch (error) {
    console.error(
      "CBIC fetch failed:",
      error,
    );

    return [];
  }
}

async function fetchPayload() {
  const items = await fetchCBICNews();

  if (items.length === 0) {
    console.error(
      "No CBIC updates found",
    );

    Deno.exit(1);
  }

  console.info(
    `Generating feed (${items.length} items)...`,
  );

  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);

    atomFeed.addItem({
      title: item.title,

      link: item.link,

      id: item.id,

      updated: item.date,

      summary: item.title,

      content: {
        body: item.html,

        type: "html",
      },
    });
  }

  try {
    Deno.writeTextFileSync(
      fileName,
      atomFeed.build(),
    );

    console.log(
      `Saved to ${fileName}`,
    );
  } catch (error) {
    console.error(
      `Failed saving ${fileName}`,
      error,
    );

    Deno.exit(1);
  }
}

function main() {
  const args = Deno.args;

  if (args.length === 1) {
    fileName = args[0];
  }

  fetchPayload();
}

main();
