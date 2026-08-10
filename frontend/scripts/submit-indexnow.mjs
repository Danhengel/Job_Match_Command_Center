const INDEXNOW_KEY = "431867e3f6bc47f8b07306853f3784ba";
const SITE_URL = "https://careernaviq.com";
const HOST = "careernaviq.com";
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForKeyFile(maxAttempts = 10, delayMs = 30000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${KEY_LOCATION}?v=${Date.now()}`, {
        headers: { "user-agent": "CareerNavIQ-IndexNow/1.0" },
        cache: "no-store",
      });
      if (response.ok) {
        const body = (await response.text()).trim();
        if (body === INDEXNOW_KEY) return;
      }
    } catch {
      // Deployment may still be coming online. Retry below.
    }

    if (attempt < maxAttempts) {
      console.log(`IndexNow key file not ready yet (attempt ${attempt}/${maxAttempts}); retrying...`);
      await sleep(delayMs);
    }
  }

  throw new Error(`IndexNow verification file is not reachable at ${KEY_LOCATION}`);
}

async function getSitemapUrls() {
  const response = await fetch(`${SITEMAP_URL}?v=${Date.now()}`, {
    headers: { "user-agent": "CareerNavIQ-IndexNow/1.0" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch sitemap (${response.status})`);
  }

  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter((url) => {
      try {
        return new URL(url).host === HOST;
      } catch {
        return false;
      }
    });

  if (urls.length === 0) {
    throw new Error("No CareerNavIQ URLs were found in the sitemap");
  }

  return [...new Set(urls)];
}

async function submitIndexNow() {
  await waitForKeyFile();
  const urlList = await getSitemapUrls();

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  if (![200, 202].includes(response.status)) {
    const body = await response.text();
    throw new Error(`IndexNow submission failed (${response.status}): ${body}`);
  }

  console.log(`IndexNow accepted ${urlList.length} CareerNavIQ URL(s) with HTTP ${response.status}.`);
}

submitIndexNow().catch((error) => {
  console.error(error);
  process.exit(1);
});
