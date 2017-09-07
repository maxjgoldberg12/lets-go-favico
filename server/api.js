const express = require('express');
const { query, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

const router = express.Router();

router.get(
  '/v1/favicon',
  // Validate the query is a URL
  query('lookup-url')
    .isURL()
    .withMessage('Please request a valid URL'),
  async (req, res) => {
    try {
      // Throw an error for invalid query
      const errors = validationResult(req);
      if (!validationResult(req).isEmpty()) {
        return res.status(422).json({ errors: errors.mapped() });
      }

      // Get our valid query
      let lookupUrl = matchedData(req)['lookup-url'];

      // Make sure it's an absolute URL
      // TODO: Handle path relative ('/files/thing') and protocol-relative ('//stuff.com') strings
      if (!lookupUrl.match(/^http/)) {
        lookupUrl = `http://${lookupUrl}`;
      }
      console.log(lookupUrl);

      // Fetch the page's html
      const html = await (await fetch(lookupUrl)).text();

      // Load html into cheerio
      const $ = cheerio.load(html);

      // Select the favicons on the page
      const favicons = $('link[rel="icon"]', 'head');
      console.log(`Found ${favicons.get().length} favicons!`);

      // Get the URL of the first favicon we found
      const faviconUrl = favicons.attr('href');
      console.log(faviconUrl);
      // TODO Coerce href back to an absolute URL
      // TODO Map over all found icons and pick the best or return all

      // Return faviconUrl
      return res.json({ faviconUrl });
    } catch (err) {
      // Catch any internal errors
      return res.status(422).json(`${err.name} - ${err.message}`);
    }
  },
);

module.exports = router;
