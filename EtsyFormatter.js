const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');
const app = express();
const chromeLauncher = require('chrome-launcher');
const { Server } = require('http');

const getSections = false;

const operation = 'listings';
// const operation = 'sections';
// const operation = 'reviews';

const shop_id = 20692514;
const x_api_key = '89t4onk893vp1xsgifqogfiv';
const all_listings =
  '727334631,743722532,743721308,710574152,724432175,757589125,774820728,724435341,956905038,728749506,708275794,885005191,871073324,884997169,871060928,761770838,761771080,775644993,761769856,775644761,761769034,761769260,761769542,775642205,722125695,954834035,953480739,939528186,939530500,710573748,798578012,812459087,710575432,757587697,800313771,788707399,722128815,708268952,708350998,713481212,711518670,757590925,713479720,956902166,725378803,761766712,713477668,812452989,713478292,727336689,757595795,774820172,742610037,775642033,732939021,719079064,786433078,743724102,725380327,757592605,788707659,722133413,802100228,722209839';

const requestOptions = {
  method: 'GET',
  headers: {
    'x-api-key': `${x_api_key}`,
    // Authorization: `Bearer ${master_access_token}`,
  },
};

let earrings = [];
let pendants = [];
let rings = [];
let nose = [];
let sets = [];

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

const getTitle = (itemTitle) => {
  return itemTitle.split(',')[0];
};

const getSubtitle = (itemTitle) => {
  const subtitle = [];
  let fixedItemTitle = itemTitle.replace(/&quot;/g, '"');
  fixedItemTitle = fixedItemTitle.replace(/&#39;/g, "'");
  const title = fixedItemTitle.split(',');
  title.forEach((title, index) => {
    if (index !== 0) {
      subtitle.push(title);
    }
  });
  return subtitle.join('  •  ');
};

const getDescriptionArray = (description) => {
  let fixedDescription = description.replace(/&quot;/g, '"');
  fixedDescription = fixedDescription.replace(/&#39;/g, "'");
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
      amount: item.price.amount / item.price.divisor,
      currency: item.price.currency_code,
    },
    images: imageInfo(item.images),
  });
};

// write function to read JSON data
const separateData = (data) => {
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

    fs.writeFileSync(
      '../public/json/EtsyEarrings.json',
      JSON.stringify(earrings)
    );
    fs.writeFileSync(
      '../public/json/EtsyPendants.json',
      JSON.stringify(pendants)
    );
    fs.writeFileSync('../public/json/EtsyRings.json', JSON.stringify(rings));
    fs.writeFileSync('../public/json/EtsyNose.json', JSON.stringify(nose));
    fs.writeFileSync('../public/json/EtsySets.json', JSON.stringify(sets));
  });
};

const getListingInfo = async (listingId) => {
  const listings = await fetch(
    `https://openapi.etsy.com/v3/application/listings/${listingId}&includes=images`, // Get Listings
    requestOptions
  );
  if (listings.ok) {
    const data = await listings.json();
    return { title: data.title, image: data.images[0].url_170x135 };
  }
};

const processReviews = (reviews) => {
  const reviewArray = [];
  reviews.results.forEach((review) => {
    const info = getListingInfo(review.listing_id);
    const reviewObj = {
      listingId: review.listing_id,
      rating: review.rating,
      username: '',
      review: review.review,
      creationDate: review.create_timestamp,
      updateDate: review.update_timestamp,
      title: info.title,
      image: info.image,
    };
    reviewArray.push(reviewObj);
  });
  fs.writeFileSync('../public/json/Reviews.json', JSON.stringify(reviewArray));
};

app.get('/', async (req, res) => {
  const response =
    operation === 'listings'
      ? await fetch(
          `https://openapi.etsy.com/v3/application/shops/${shop_id}/sections`, // Get Sections
          requestOptions
        )
      : operation === 'sections'
      ? await fetch(
          `https://openapi.etsy.com/v3/application/listings/batch?listing_ids=${all_listings}&includes=images`, // Get Listings
          requestOptions
        )
      : await fetch(
          `https://openapi.etsy.com/v3/application/shops/${shop_id}/reviews`, //Get shop reviews
          requestOptions
        );

  if (response.ok) {
    const data = await response.json();
    operation === 'sections'
      ? fs.writeFileSync('./Listings/EtsySections.json', JSON.stringify(data))
      : operation === 'reviews'
      ? processReviews(data)
      : separateData(data);
    res.send('Response Received: ' + new Date().toLocaleString());
    console.log('Response Received: ' + new Date().toLocaleString());
    process.exit(1);
  } else {
    console.log('Error:', response.status, response.statusText);
    res.send('oops');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
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

// To Run:
// node ./EtsyFormatter.js
