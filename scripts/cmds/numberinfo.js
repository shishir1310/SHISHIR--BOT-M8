const axios = require("axios");

module.exports = {
  config: {
    name: "numberinfo",
    aliases: ["numinfo", "phoneinfo", "num"],
    version: "2.0.0",
    role: 0,
    hasPrefix: true,
    credits: "SHISHIR",
    description: "Phone number information lookup",
    usage: "[phone number]",
    cooldown: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const input = args.join(" ").trim();

    const send = (text) =>
      api.sendMessage(text, threadID, messageID);

    if (!input) {
      return send(
        "╭━━━『 📱 𝐍𝐔𝐌𝐁𝐄𝐑 𝐈𝐍𝐅𝐎 』━━━╮\n" +
        "┃\n" +
        "┃ ❌ Please enter a phone number!\n" +
        "┃\n" +
        "┃ 📌 Example:\n" +
        "┃ numberinfo +8801712345678\n" +
        "┃\n" +
        "╰━━━『 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 』━━━╯"
      );
    }

    // Remove spaces and common formatting characters
    const phone = input.replace(/[\s().-]/g, "");

    if (!/^\+?\d{7,15}$/.test(phone)) {
      return send(
        "❌ Invalid number format!\n\n" +
        "Enter 7–15 digits, optionally starting with +.\n" +
        "Example: numberinfo +8801712345678"
      );
    }

    let searchingMsg = null;

    try {
      searchingMsg = await new Promise((resolve) => {
        api.sendMessage(
          "🔍 𝐍𝐔𝐌𝐁𝐄𝐑 𝐈𝐍𝐅𝐎 𝐒𝐄𝐀𝐑𝐂𝐇𝐈𝐍𝐆...\n" +
          "━━━━━━━━━━━━━━━━━━",
          threadID,
          (err, info) => resolve(err ? null : info)
        );
      });

      // libphonenumber-js provides parsing and validation.
      // Install it using: npm install libphonenumber-js
      const { parsePhoneNumberFromString } =
        require("libphonenumber-js/max");

      const parsed = parsePhoneNumberFromString(phone);

      if (!parsed) {
        throw new Error("Unable to parse this phone number.");
      }

      const valid = parsed.isValid();
      const possible = parsed.isPossible();

      const country = parsed.country || "Unknown";
      const countryCode = `+${parsed.countryCallingCode}`;
      const nationalNumber = parsed.nationalNumber || "Unknown";
      const international = parsed.formatInternational();
      const national = parsed.formatNational();
      const numberType = parsed.getType() || "Unknown";

      let countryName = country;

      // Get a readable country name
      try {
        const displayNames = new Intl.DisplayNames(["en"], {
          type: "region"
        });
        countryName = displayNames.of(country) || country;
      } catch (_) {}

      // Time zone information is country-level, not exact location.
      let timezones = "Unknown";

      try {
        const response = await axios.get(
          "https://restcountries.com/v3.1/alpha/" +
            encodeURIComponent(country),
          {
            timeout: 10000,
            params: {
              fields: "name,capital,region,flags,timezones"
            }
          }
        );

        const data = response.data?.[0];

        if (data) {
          countryName = data.name?.common || countryName;
          timezones = data.timezones?.join(", ") || "Unknown";
        }
      } catch (_) {
        // Country API is optional; phone lookup still works.
      }

      const status = valid
        ? "Valid ✅"
        : possible
          ? "Possible, not confirmed ⚠️"
          : "Invalid / unsupported ❌";

      const message =
        "╭━━━『 📱 𝐍𝐔𝐌𝐁𝐄𝐑 𝐈𝐍𝐅𝐎 』━━━╮\n" +
        "┃\n" +
        `┃ ☎️ Number: ${international}\n` +
        `┃ 🌍 Country: ${countryName}\n` +
        `┃ 🔢 Country Code: ${countryCode}\n` +
        `┃ 📞 National Number: ${nationalNumber}\n` +
        `┃ 📝 National Format: ${national}\n` +
        `┃ ✅ Validation: ${status}\n` +
        `┃ 📡 Number Type: ${numberType}\n` +
        `┃ 🕒 Country Timezone: ${timezones}\n` +
        "┃\n" +
        "┣━━━━━━━━━━━━━━━━━━\n" +
        "┃ 👤 Owner Name: Not available\n" +
        "┃ 🆔 Facebook ID: Not available\n" +
        "┃ 📡 Current Operator: Not verified\n" +
        "┃\n" +
        "┃ ⚠️ Number validation does not prove\n" +
        "┃ ownership or current SIM activity.\n" +
        "┃ Number portability may affect operator.\n" +
        "╰━━━『 𝐌𝐀𝐃𝐄 𝐁𝐘 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 』━━━╯";

      if (
        searchingMsg?.messageID &&
        typeof api.editMessage === "function"
      ) {
        return api.editMessage(message, searchingMsg.messageID);
      }

      return send(message);
    } catch (error) {
      console.error("[NUMBERINFO ERROR]", error.message);

      const errorMsg =
        "╭━━━『 ⚠️ 𝐍𝐔𝐌𝐁𝐄𝐑 𝐈𝐍𝐅𝐎 』━━━╮\n" +
        "┃\n" +
        "┃ ❌ Lookup failed!\n" +
        "┃ Check the number and try again.\n" +
        "┃ Ensure libphonenumber-js is installed.\n" +
        "┃\n" +
        "╰━━━『 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 』━━━╯";

      if (
        searchingMsg?.messageID &&
        typeof api.editMessage === "function"
      ) {
        return api.editMessage(errorMsg, searchingMsg.messageID);
      }

      return send(errorMsg);
    }
  }
};
