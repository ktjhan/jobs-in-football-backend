const puppeteer = require("puppeteer-extra");
const adblockerPlugin = require("puppeteer-extra-plugin-adblocker");

async function scrapeJobsInFootball() {
    puppeteer.use(adblockerPlugin());
  
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
  
    await page.goto(
      "https://jobsinfootball.com/jobs/?q=analyst&l=United%20States&p=1&s=583"
    );
  
    async function loadMoreJobs() {
      let previousJobCount = await getJobCount();
  
      const loadMoreButton = await page.$("button.load-more");
      if (loadMoreButton) {
        await loadMoreButton.click();
  
        try {
          await page.waitForFunction(
            (previousCount, jobSelector) => {
              const currentCount = document.querySelectorAll(jobSelector).length;
              const loadMoreButtonExists =
                document.querySelector("button.load-more") !== null;
              return currentCount > previousCount || !loadMoreButtonExists;
            } ,
            { timeout: 10000 },
            previousJobCount,
            ".media.well.listing-item.listing-item__jobs"
          );
        } catch (error) {
          console.error(
            "Error while waiting for more jobs to load:",
            error.message
          );
          return;
        }
  
        let currentJobCount = await getJobCount();
        if (currentJobCount > previousJobCount) {
          await loadMoreJobs();
        }
      }
    }
  
    async function getJobCount() {
      return page.evaluate((jobSelector) => {
        return document.querySelectorAll(jobSelector).length;
      }, ".media.well.listing-item.listing-item__jobs");
    }
  
    await loadMoreJobs();
  
    const resultList = await page.evaluate(() => {
      const resultArray = [];
      const items = document.querySelectorAll("article.media");
  
      items.forEach((item) => {
        const logoImgElement = item.querySelector(
          ".media-left.listing-item__logo img"
        );
        const logoImgUrl = logoImgElement ? logoImgElement.src : null;
  
        const jobTitleElement = item.querySelector(".media-heading a");
        const jobLink = jobTitleElement ? jobTitleElement.href : null;
        const jobTitle = jobTitleElement
          ? jobTitleElement.innerText.trim()
          : null;
  
        const clubNameElement = item.querySelector(
          ".listing-item__info--item-company"
        );
        const clubName = clubNameElement
          ? clubNameElement.innerText.trim()
          : null;
  
        const locationElement = item.querySelector(
          ".listing-item__info--item-location"
        );
        const location = locationElement
          ? locationElement.innerText.replace(", USA", "").trim()
          : null;
  
        const data = {
          logoImgUrl,
          jobTitle,
          clubName,
          location,
          jobLink,
        };
        resultArray.push(data);
      });
      return resultArray;
    });
  
    console.log(resultList);
    await browser.close();

    return resultList;
  }

  module.exports = scrapeJobsInFootball