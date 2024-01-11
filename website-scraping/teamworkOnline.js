const puppeteer = require("puppeteer-extra");
const adblockerPlugin = require("puppeteer-extra-plugin-adblocker");

async function scrapeTeamwork() {
  puppeteer.use(adblockerPlugin());

  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(
      "https://www.teamworkonline.com/jobs-in-sports?employment_opportunity_search%5Bquery%5D=analyst&employment_opportunity_search%5Bsort_by%5D=most_recent&employment_opportunity_search%5Blicense_group_ids%5D%5B%5D=232"
    );
    await page.waitForSelector(".result-list");
    let resultArray = [];

    async function scrapeCurrentPage() {
      return page.evaluate(() => {
        const pageResults = [];
        const items = document.querySelectorAll(
          ".result-list .browse-jobs-card"
        );

        items.forEach((item) => {
          const logoImgElement = item.querySelector(
            ".browse-jobs-card__image img"
          );
          const logoImgUrl = logoImgElement ? logoImgElement.src : null;

          const jobTitleElement = item.querySelector(
            ".browse-jobs-card__content--title"
          );
          const jobLink = jobTitleElement
            ? `https://www.teamworkonline.com${jobTitleElement.getAttribute(
                "href"
              )}`
            : null;

          //for future reference regarding thefresh date of the jobs
          /* 
          const scoreboardElements = Array.from(item.querySelectorAll('.browse-jobs-card__scoreboard'));
          const timeElement = item.querySelector('.trending__content--small.trending__scoreboard--time');
          const scoreboardTexts = scoreboardElements.map(el => el.innerText.trim());
          const timeText = timeElement ? timeElement.innerText.trim() : null;
        */

          const trendingContents = Array.from(
            item.querySelectorAll(".trending__content--small")
          );
          let location = null;
          trendingContents.forEach((el) => {
            if (el.innerText.includes("·")) {
              location = el.innerText.replace("·", ",").trim();
            }
          });

          const data = {
            logoImgUrl,
            jobTitle: item
              .querySelector(".browse-jobs-card__content--title")
              .innerText.trim(),
            clubName: item
              .querySelector(".browse-jobs-card__content--organization")
              .innerText.replace("Jobs", "")
              .trim(),
            location,
            // timeSincePosted: scoreboardTexts.join("") + " " + timeText,
            jobLink,
          };
          pageResults.push(data);
        });
        return pageResults;
      });
    }

    async function getNextPageUrl() {
      return page.evaluate(() => {
        const nextLink = document.querySelector("span.next a[rel='next']");
        return nextLink ? nextLink.href : null;
      });
    }

    async function hasPagination() {
      return page.evaluate(() => {
        return !!document.querySelector("nav.pagination");
      });
    }

    let currentPageResults = await scrapeCurrentPage();
    resultArray = resultArray.concat(currentPageResults);

    while (await hasPagination()) {
      let nextPageUrl = await getNextPageUrl();

      if (!nextPageUrl) {
        break;
      }

      await page.goto(nextPageUrl);

      try {
        await page.waitForSelector(".result-list .browse-jobs-card", {
          timeout: 10000,
        });
      } catch (error) {
        console.log("No more new jobs found or page did not load properly.");
        break;
      }

      currentPageResults = await scrapeCurrentPage();
      if (currentPageResults.length === 0) {
        break;
      }

      resultArray = resultArray.concat(currentPageResults);
    }

    console.log(resultArray);
    await browser.close();
    
    return resultArray;
  } catch (error) {
    console.error(error);
  }
}

module.exports = scrapeTeamwork;
