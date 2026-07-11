import assert from "node:assert/strict";

import { buildMarketingMetadata } from "./metadata";
import { siteConfig } from "./site-config";

const faqMetadata = buildMarketingMetadata({ locale: "pl", path: "/faq", title: "FAQ" });

assert.equal(faqMetadata.title, "FAQ");
assert.equal(faqMetadata.openGraph?.title, "FAQ | Esteo");
assert.equal(faqMetadata.twitter?.title, "FAQ | Esteo");
assert.notEqual(faqMetadata.title, `FAQ | ${siteConfig.name} | ${siteConfig.name}`);

const homeMetadata = buildMarketingMetadata({
  locale: "pl",
  path: "/",
  title: "Program do wycen i kosztorysów z AI",
});

assert.equal(homeMetadata.title, "Program do wycen i kosztorysów z AI");
assert.equal(homeMetadata.openGraph?.title, "Program do wycen i kosztorysów z AI | Esteo");

const defaultMetadata = buildMarketingMetadata({ locale: "pl" });

assert.equal(defaultMetadata.title, siteConfig.name);
assert.equal(defaultMetadata.openGraph?.title, siteConfig.name);

console.log("metadata.test.ts: all assertions passed");
