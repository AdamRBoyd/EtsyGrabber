# Etsy Grabber

This is the repo for my Etsy listings API to JSON converter for my [main web page](https://github.com/phoenix239/AdamBoydDesigns_Website).

## About

Etsy has given us an API to access listing info, reviews, sales info, etc. that I used for my [jewelry website](https://github.com/phoenix239/AdamBoydDesigns_Website).

I created this program to:

- Filter down the info to what I need. Unfortunately there is a lot of info bloat as compared to what info I actually use (see UnfilteredData.json and compare to EtsyAll.json).
- To speed up info access and not have to do MANY fetch requests I created this to simply save all the info I need as a set file.
- Get around a CORS issue with Etsy, React and fetch.

### etsyItems.json

- So Etsy made this API for people providing an app for sellers to access their listings, and most methods require a OAuth that expires and has to be renewed, which is not optimal for my usage... This file allows me to use one method that provides not only info, but image urls for ALL my listings, including sold out items.

### Whats Missing?

For security reasons I have not included the file that contains my api key, but you can run this if you receive an api key from Etsy and create a file in the main directory named `apiKeys.json` Formatted as such:

```JSON
{
  "etsyKey": "YourApiKey"
}
```

<br>

## [Click Here For more info on the Etsy Api](https://developers.etsy.com/documentation/)
