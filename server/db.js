const finder = require('./findFavicon');

// Setup Knex with pg database
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

// Setup our table schema as necessary
knex.schema
  .createTableIfNotExists('favicons', (favicons) => {
    favicons.increments('id');
    favicons.text('lookup_url');
    favicons.text('favicon_url');
    favicons.dateTime('created_at');
  })
  .then(() => {
    console.log('favicons table created');
  })
  .catch((error) => {
    console.log(error);
  });

knex.schema
  .createTableIfNotExists('seed', (seed) => {
    seed.increments('id');
    seed.text('seed_url');
    seed.boolean('processed');
  })
  .then(() => {
    console.log('seed table created');
  })
  .catch((error) => {
    console.log(error);
  });

// Look for a favicon record in the DB based on lookupUrl
module.exports.getFaviconUrl = async function getFaviconUrl(lookupUrl) {
  try {
    // Check the most recent existing record for lookupUrl (if it exists)
    const favicons = await knex('favicons')
      .where('lookup_url', lookupUrl)
      .orderBy('created_at', 'desc')
      .select()
      .limit(1);

    return favicons[0];
  } catch (error) {
    console.log(error);
    return error;
  }
};

// Save a new favicon record to DB
module.exports.saveFaviconUrl = async function saveFaviconUrl(
  lookupUrl,
  faviconUrl,
) {
  try {
    return knex('favicons').insert({
      lookup_url: lookupUrl,
      favicon_url: faviconUrl,
      created_at: new Date(),
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

// Process our seed table
module.exports.runSeed = async function runSeed() {
  try {
    console.log('runSeed');
    knex('seed')
      .orderBy('id', 'asc')
      .where('processed', false)
      .limit(1000)
      .map((row) => {
        console.log(row.id);
        const faviconUrl = finder.findAndSaveFaviconUrl(
          `http://${row.seed_url}`,
          row.id,
        );

        return faviconUrl;
      });
  } catch (error) {
    return error;
  }
};

module.exports.updateSeed = function updateSeed(rowId) {
  return knex('seed').where('id', rowId).update('processed', true).return();
};
