const express = require('express');
const { query, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const finder = require('./findFavicon');

const db = require('./db');

const router = express.Router();

// Endpoint to get the favicon for a URL
// @param {string} lookup-url - The URL to fetch the favicon from.
// Can be with or without protocol (http://)
// @param {string} [fresh='no'] - Should be fetch the current favicon even if
// we have a record in the DB already?
// Example: letsgofavico.com/api/v1/favicon?lookup-url=example.com&fresh=true
router.get(
  '/v1/favicon',
  [
    // Validate the query is a URL
    query('lookup-url')
      .isURL()
      .withMessage('Please request a valid URL'),
    // Validate fresh is 'yes' or 'no', if it exists
    query('fresh')
      .isIn(['yes', 'no'])
      .optional(),
  ],
  async (req, res) => {
    try {
      // Throw an error for invalid query
      const errors = validationResult(req);
      if (!validationResult(req).isEmpty()) {
        return res.status(422).json({ error: 'Please enter a valid URL.' });
      }

      // Get our valid lookupUrl
      let lookupUrl = matchedData(req)['lookup-url'];

      // Handle no-protocol URLs ("example.com")
      if (!lookupUrl.match(/^http/)) {
        lookupUrl = `http://${lookupUrl}`;
      }

      // If we need a fresh lookup
      if (matchedData(req).fresh) {
        const faviconUrl = await finder.findAndSaveFaviconUrl(lookupUrl);
        return res.json({ faviconUrl });
      }

      // Otherwise, check the DB for a matching faviconUrl
      const mostRecentFaviconUrl = await db.getFaviconUrl(lookupUrl);
      if (mostRecentFaviconUrl) {
        console.log(`Returning saved url for ${lookupUrl}`);
        return res.json({ faviconUrl: mostRecentFaviconUrl.favicon_url });
      }

      // If we didn't get a match in DB, fetch it fresh
      const newFaviconUrl = await finder.findAndSaveFaviconUrl(lookupUrl);
      return res.json({ faviconUrl: newFaviconUrl });
    } catch (error) {
      // Catch any internal errors
      return res.status(422).json(`${error.name} - ${error.message}`);
    }
  },
);

router.post('/v1/seed', (req, res) => {
  try {
    db.runSeed();
    return res.json({});
  } catch (error) {
    return res.status(422).json(`${error.name} - ${error.message}`);
  }
});

module.exports = router;
