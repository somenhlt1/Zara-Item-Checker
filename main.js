// A simple runner for the zara class
//You can add multiple links


const scraper = require("./webscraper");

//Puppeteer headless browser import required
const puppeteer = require("puppeteer");

//Import enviromental variable
require("dotenv").config();

//Email sending api
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//SMS sending api
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

async function test() {
  const app = new scraper();
  app.setUpEmailSMS(sgMail, accountSid, authToken, client, puppeteer);

  let found = false;

  //An example link
  // Can add more
  let links = [
    "https://www.zara.com/us/en/ruffled-flowy-blouse-p03564069.html",
  ];

  while (links.length > 0) {
    console.log("Start searching...\n");
    for (let i = 0; i < links.length; i++) {
      app.setLink(links[i]);
      let data = await app.checkAvailableItem();
      console.log(data);
      console.log("\n----------------------------------\n");
      for (const item in data) {
        if (item == "name") continue;
        //Adding your size you want here?
        if (data[item].sizeName == "S" && data[item].available == "yes") {
          found = true;
          break;
        }
      } //for loop

      if (found) {
        const fromEmail = "your api email";
        const toEmail = "your to email here";
        var body = `<table border=1> <tr><td>${JSON.stringify(
          data.name
        )}</td></tr>`;
        for (const size in data) {
          if (size == "name") continue;
          body += `<tr><td>${JSON.stringify(data[size])}</td></tr>`;
        }
        body += `</table>`;
        const subject = "Zara Item Available Checker";

        app.sendEmail(toEmail, fromEmail, subject, body);

        const toPhoneNumber = "your tophone number";
        const fromPhoneNumber = "phone number api here";

        app.sendSMS(
          toPhoneNumber,
          fromPhoneNumber,
          JSON.stringify(data.name) + "\nYour size is here.\n Go buy it now."
        );

        const index = links.indexOf(links[i]);
        console.log("\n Removed " + links[i]);
        links.splice(index, 1);
        found = false;
        break;
      }
      //Wait each link to make sure the site is not going to blocked you for spamming.
      if (i < links.length - 1)
        await app.sleep(Math.floor(Math.random() * 100000 + 1));
      else {
        await app.sleep(Math.floor(Math.random() * 5000 + 1));
      }
    }
    //Wait for 10 mins for each search.
    console.log("DONE SEARCHING WAITING FOR 10 minutes...");
    await app.sleep(600000);
    console.clear();
  } // end while
}

test();
