var request = require("request");
var cheerio = require("cheerio");
var fs = require("fs");

let urls = require("./urls.json");

const extractBootcampData = (url) => {
  return new Promise((resolve, reject) => {
    request(url, function (err, resp, html) {
      if (!err) {
        const $ = cheerio.load(html);
        console.log("Checking " + url);

        let bootcampName = $(".resize-header").text();
        let aboutText = $(".about .read-more").text();

        let rating = $(".rating-value").text();
        let amountOfReviews = $(".rating-value").next().next().text();

        let courseAnchors = $(".school-tracks").find("a");
        let courses = [];
        courseAnchors.each((index, element) => {
          courses[index] = $(element).text().trim();
        });

        let locationAnchors = $(".school-info .location").find("a");
        let locations = [];
        locationAnchors.each((index, element) => {
          locations[index] = $(element).text().trim();
        });

        let extraIcons = $(".glyphicon-ok-circle");
        let extras = [];
        extraIcons.each((index, element) => {
          extras[index] = $(element).parent().text().trim();
        });

        let matchingKeywords = checkAboutTextForKeywords(aboutText);

        let bootcamp = {};
        bootcamp.name = bootcampName;
        bootcamp.url = url;
        bootcamp.rating = rating;
        bootcamp.amountOfReviews = amountOfReviews;
        bootcamp.about = aboutText;
        bootcamp.courses = courses;
        bootcamp.locations = locations;
        bootcamp.extras = extras;
        bootcamp.keywords = matchingKeywords;

        resolve(bootcamp);
      } else {
        reject({
          url,
          err
        });
      }
    });
  });
};

const checkAboutTextForKeywords = (aboutText) => {
  let keywords = require("./data/keywords.json").keywords;
  let matchingKeywords = [];
  keywords.forEach((keyword, index) => {
    if (aboutText.toLowerCase().includes(keyword)) {
      matchingKeywords.push(keyword);
    }
  });
  return matchingKeywords;
};

const writeBootcampsToFile = (bootcamps) => {
  fs.writeFile("./results/results.json", JSON.stringify(bootcamps), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully wrote to results.json");
    }
  });
};

const writeErrorsToFile = (unsuccessfulRequests) => {
  if (Object.keys(unsuccessfulRequests).length > 0) {
    fs.writeFile("./results/errors.json", JSON.stringify(unsuccessfulRequests), (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully wrote errors");
      }
    });
  }
};

const getAllBootcampData = () => {
  let promises = [];
  let bootcamps = {};
  let unsuccessfulRequests = {};

  urls.urls.forEach((url) => {
    promises.push(extractBootcampData(url).then((bootcamp) => {
      bootcamps[bootcamp.name] = bootcamp;
    }).catch((errorObject) => {
      unsuccessfulRequests[`${errorObject.url}`] = errorObject.err;
    }));
  });

  Promise.all(promises)
    .then(() => {
      writeBootcampsToFile(bootcamps);
      writeErrorsToFile(unsuccessfulRequests);
    });
}

getAllBootcampData();