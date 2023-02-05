const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');
const app = express();
const chromeLauncher = require('chrome-launcher');
const { Server } = require('http');
const apiKey = require('./apiKeys.json');
const itemNumbers = require('./etsyItems.json');

const Earrings = itemNumbers.earrings;
const Pendants = itemNumbers.pendants;
const Rings = itemNumbers.rings;
const Nose = itemNumbers.nose;
const Sets = itemNumbers.sets;
const AllListings = Earrings.concat(
  ',',
  Pendants,
  ',',
  Rings,
  ',',
  Nose,
  ',',
  Sets
);

const requestOptions = {
  method: 'GET',
  headers: {
    'x-api-key': `${apiKey.etsyKey}`,
  },
};

const getListingSectionUrl = (section) => {
  let sectionIDs;
  switch (section) {
    case 'earrings':
      sectionIDs = Earrings;
    case 'pendants':
      sectionIDs = Pendants;
    case 'rings':
      sectionIDs = Rings;
    case 'nose':
      sectionIDs = Nose;
    case 'sets':
      sectionIDs = Sets;
    default:
      sectionIDs = AllListings;
  }
  return `https://openapi.etsy.com/v3/application/listings/batch?listing_ids=${sectionIDs}&includes=images`;
};

const imageInfo = (item) => {
  let image = [];
  item.forEach((element) => {
    let imageObj = {
      rank: element.rank,
      imageUrl75x75: element.url_75x75,
      imageUrl170x135: element.url_170x135,
      imageUrl570xN: element.url_570xN,
      imageUrlFullxFull: element.url_fullxfull,
      fullHeight: element.full_height,
      fullWidth: element.full_width,
    };
    image.push(imageObj);
  });
  return image;
};

const stringCleaner = (incomingString) => {
  let newString = incomingString;
  newString = newString.replace(/&quot;/g, '"');
  newString = newString.replace(/&amp;/g, '&');
  newString = newString.replace(/&#39;/g, "'");
  return newString;
};

const getTitle = (itemTitle) => {
  let shortItemTitle = itemTitle.split(',')[0];
  return stringCleaner(shortItemTitle);
};

const getSubtitle = (itemTitle) => {
  const subtitle = [];
  let fixedItemTitle = stringCleaner(itemTitle);
  const title = fixedItemTitle.split(',');
  title.forEach((title, index) => {
    if (index !== 0) {
      subtitle.push(title);
    }
  });
  return subtitle.join('  •  ');
};

const getDescriptionArray = (description) => {
  let fixedDescription = stringCleaner(description);
  const descriptionArray = fixedDescription.split('\n');
  return descriptionArray;
};

const listingInfo = (item, index) => {
  return (newItem = {
    index: index,
    listingId: item.listing_id,
    title: getTitle(item.title),
    subtitle: getSubtitle(item.title),
    description: getDescriptionArray(item.description),
    state: item.state,
    creationDate: item.original_creation_timestamp,
    modifiedDate: item.last_modified_timestamp,
    stateTimestamp: item.state_timestamp,
    quantity: item.quantity,
    url: item.url,
    tags: item.tags,
    materials: item.materials,
    processingMin: item.processing_min,
    processingMax: item.processing_max,
    hasVariations: item.has_variations,
    price: {
      amount: Math.round(item.price.amount / item.price.divisor),
      currency: item.price.currency_code,
    },
    images: imageInfo(item.images),
  });
};

// write function to read JSON data
const separateData = (data, section) => {
  let earrings = [];
  let pendants = [];
  let rings = [];
  let nose = [];
  let sets = [];
  let all = [];

  data.results.forEach((item, index) => {
    switch (item.shop_section_id) {
      case 26730231: // Earrings
        earrings.push(listingInfo(item, index));
        break;
      case 26730425: // Pendants
        pendants.push(listingInfo(item, index));
        break;
      case 26862145: // Rings
        rings.push(listingInfo(item, index));
        break;
      case 30727640: // Nose
        nose.push(listingInfo(item, index));
        break;
      default: // Sets
        sets.push(listingInfo(item, index));
        break;
    }
    all.push(listingInfo(item, index));
  });

  switch (section) {
    case 'earrings':
      fs.writeFileSync('Listings/EtsyEarrings.json', JSON.stringify(earrings));
      break;
    case 'pendants':
      fs.writeFileSync('Listings/EtsyPendants.json', JSON.stringify(pendants));
      break;
    case 'rings':
      fs.writeFileSync('Listings/EtsyRings.json', JSON.stringify(rings));
      break;
    case 'nose':
      fs.writeFileSync('Listings/EtsyNose.json', JSON.stringify(nose));
      break;
    case 'sets':
      fs.writeFileSync('Listings/EtsySets.json', JSON.stringify(sets));
      break;
    case 'all':
    default:
      fs.writeFileSync('Listings/EtsyEarrings.json', JSON.stringify(earrings));
      fs.writeFileSync('Listings/EtsyPendants.json', JSON.stringify(pendants));
      fs.writeFileSync('Listings/EtsyRings.json', JSON.stringify(rings));
      fs.writeFileSync('Listings/EtsyNose.json', JSON.stringify(nose));
      fs.writeFileSync('Listings/EtsySets.json', JSON.stringify(sets));
      break;
  }
  fs.writeFileSync('Listings/EtsyAll.json', JSON.stringify(all));
};

app.get('/', async () => {
  const listingSection = process.argv[2] ? process.argv[2] : 'all';

  console.log('Listing Section: ', listingSection);

  let response = await fetch(
    getListingSectionUrl(listingSection), // Get Listings
    requestOptions
  );

  if (response?.ok) {
    const data = await response.json();
    fs.writeFileSync('./Listings/UnfilteredData.json', JSON.stringify(data));
    console.log('Processing Listings...');
    separateData(data, listingSection);
    console.log('Response Received: ' + new Date().toLocaleString());
    process.exit(1);
  } else {
    console.log('Error:', response.status, response.statusText);
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
  // Launch chrome
  chromeLauncher
    .launch({
      startingUrl: 'http://localhost:3000',
      chromeFlags: ['--headless'],
    })
    .then((chrome) => {
      console.log(`Chrome debugging port running on ${chrome.port}`);
    });
});

// To Run, pick one of the following commands:
// node EtsyFormatter OR node EtsyFormatter all
// node EtsyFormatter earrings
// node EtsyFormatter pendants
// node EtsyFormatter rings
// node EtsyFormatter nose
// node EtsyFormatter sets
