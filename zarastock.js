
/**
 * Web scraper for Zara.com/us
 * To check for if any item is available with the sizes.
 * Send email or sms to users for notification.
 */
 class Scraper {
  constructor(url) {
      this.url = url;
      this.sgMail = null;
      this.accountSid = null;
      this.authToken = null;
      this.client = null;
      this.puppeteer = null;
     }
     
    
    /**
     * Setup the email and SMS API
     * This is required for using API from @sendGrid and @TWILIO
     * Look at the documentation for how to use it.
     */
    setUpEmailSMS(sgMail,accountSid,authToken,client,puppeteer) {
        this.sgMail = sgMail;
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.client = client;
        this.puppeteer = puppeteer;
     }
     
     setLink(url) {
         this.url = url;
     }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Going to the url and grab the information.
   * @returns object {name: name of the item,...itemsSize: size and its status.}
   */
  async checkAvailableItem() {
    var itemStatus;

    try {
      const browser = await this.puppeteer.launch();
      const page = await browser.newPage();
      await page
        .goto(this.url, {
          waitUntil: ["load", "domcontentloaded"],
        })
        .then(async () => {
          const title = await page.evaluate(() => document.title);
          const items = await page.evaluate(() =>
            Array.from(
              document.querySelectorAll(
                "#main > article > div.product-detail-view__main > div.product-detail-view__side-bar > div.product-detail-info.product-detail-view__product-info > div.product-detail-size-selector.product-detail-info__size-selector.product-detail-size-selector--is-open.product-detail-size-selector--expanded > div > ul > li.product-detail-size-selector__size-list-item"
              )
            ).map((rs) => ({
              sizeName: rs.textContent.trim(),
              available:
                rs.className ==
                "product-detail-size-selector__size-list-item product-detail-size-selector__size-list-item--is-disabled product-detail-size-selector__size-list-item--out-of-stock"
                  ? "no"
                  : "yes",
            }))
          );
          itemStatus = { name: title, ...items };
          await browser.close();
        });
      return itemStatus;
    } catch (erro) {
      console.log(erro);
      browser.close();
      return undefined;
    }
  }

  /**
   * Send email
   * @param {*} toEmail to email you want to send
   * @param {*} fromEmail from email you send to.
   * @param {*} subject any subject
   * @param {*} body any body
   * @returns
   */
  sendEmail(toEmail, fromEmail, subject, body) {
    const email = {
      to: toEmail,
      from: fromEmail,
      subject: subject,
      text: body,
      html: body,
    };
    return this.sgMail.send(email);
  }
  /**
   * Send SMS to a phone number
   * @param {*} toPhoneNumber
   * @param {*} fromPhoneNumber
   * @param {*} body
   */
  async sendSMS(toPhoneNumber, fromPhoneNumber, body) {
    await this.client.messages
      .create({
        body: body,
        from: fromPhoneNumber,
        to: toPhoneNumber,
      })
      .then((message) => console.log("SMS sent with ID: " + message.sid));
  }

  /**
   * This method finds any item link on the website.
   * If the item is found then return the link.
   * If the item is not found then return undefined.
   * string name: name of the item.
   * @returns string or undefined.
   */
  async findItemLink(name) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://www.zara.com/us/en/search", {
      waitUntil: ["load", "domcontentloaded"],
    });

    await page.type("#search-products-form-combo-input", search);

    // console.log(i);
    try {
      const i = await page.waitForSelector(
        "#main > article > div > div > div.search-products-view__search-results > section > ul >li >a"
      );
      const preloadHref = await page.$eval(
        "#main > article > div > div > div.search-products-view__search-results > section > ul > li > a",
        (el) => el.href
      );
      console.log(preloadHref);
      await checkAvailable(preloadHref);
    } catch (e) {
      console.log("Product not found");
      await browser.close();
    }

    await browser.close();
  }
} // End class

module.exports = Scraper
