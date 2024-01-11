const express = require("express");
const cors = require("cors");

const scrapeTeamwork = require("./website-scraping/teamworkOnline");
const scrapeJobsInFootball = require("./website-scraping/jobsInFootball");

const app = express();

app.use(cors());

const port = 3001;

app.get("/jobs", async (req, res) => {
  try {
    const [teamworkJobs, footballJobs] = await Promise.all([
      scrapeTeamwork().catch(error => {
        console.error('Error in scrapeTeamwork:', error);
        return []; // Return an empty array in case of error
      }),
      scrapeJobsInFootball().catch(error => {
        console.error('Error in scrapeJobsInFootball:', error);
        return []; // Return an empty array in case of error
      })
    ]);

    const combinedJobs = [...teamworkJobs, ...footballJobs];
    res.json(combinedJobs);
  } catch (error) {
    res.status(500).json({ "Error: ": error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
