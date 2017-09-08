const cheerio = require('cheerio');
const fetch = require('node-fetch');
const { URL } = require('url');

const db = require('./db');

// @param {string} lookupUrl - An absolute URL string
// @return {string} An absolute URL to the favicon at lookupUrl
async function findFaviconUrl(lookupUrl) {
  try {
    // Build a Node URL object
    const lookupUrlObject = new URL(lookupUrl);

    // Fetch the URL and parse html
    // TODO: Resolve issue where fetch throws TypeError for
    // unusual headers in response from certain site
    const res = await fetch(lookupUrl);
    const html = await res.text();

    // Load html into cheerio
    const $ = cheerio.load(html);

    // Select the favicons on the page
    let favicons = $('link[rel~="icon"]', 'head');
    // Deal with weirdos who use "rel='Icon'"
    if (favicons.get().length === 0) {
      favicons = $('link[rel~="Icon"]', 'head');
    }

    console.log(`Found ${favicons.get().length} favicons!`);

    if (favicons.get().length === 0) {
      return false;
    }

    // Get the href of the first favicon we found
    const faviconHref = favicons.attr('href');

    // Return an absolute favicon URL
    const faviconUrlObject = new URL(faviconHref, lookupUrlObject.href);

    // TODO Map over all found favicons and pick the best one or return all

    // Return faviconUrl string
    return faviconUrlObject.href;
  } catch (error) {
    // Catch any internal errors
    return false;
  }
}

// Find the faviconUrl and save to DB
module.exports.findAndSaveFaviconUrl = async function findAndSaveFaviconUrl(
  lookupUrl,
  rowId,
) {
  try {
    const faviconUrl = await findFaviconUrl(lookupUrl);

    if (faviconUrl) {
      db.saveFaviconUrl(lookupUrl, faviconUrl);
      if (rowId) {
        db.updateSeed(rowId);
      }
    }
    return faviconUrl;
  } catch (error) {
    return error;
  }
};
