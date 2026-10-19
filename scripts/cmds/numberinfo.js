const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {
  parsePhoneNumberFromString
} = require("libphonenumber-js/max");

module.exports = {
  config: {
    name: "numberinfo",
    aliases: ["numinfo", "phoneinfo", "num"],
    version: "3.0.0",
    role: 0,
    hasPrefix: true,
    credits: "SHISHIR",
    description: "Phone information and contact lookup",
    usage: "[phone number]",
    cooldown: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const input = args.join(" ").trim();

    const reply = (text) =>
      api.sendMessage(text, threadID, messageID);

    const editOrReply = async (text, info) => {
      if (info?.messageID && typeof api.editMessage === "function") {
        try {
          return await api.editMessage(text, info.messageID);
        } catch (_) {}
      }
      return reply(text);
    };

    if (!input) {
      return reply(
        "╭━━━『 📱 𝐍𝐔𝐌𝐁𝐄𝐑 𝐈𝐍𝐅𝐎 』━━━╮\n" +
        "┃\n" +
        "┃ 📌 Usage:\n" +
        "┃ numberinfo +8801712345678\n" +
        "┃\n" +
        "┃ 🔎 Contact lookup:\n" +
        "┃ numberinfo 01712345678\n" +
        "┃\n" +
        "╰━━━『 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 』━━━╯"
      );
    }

    const normalized = input.replace(/[\s().-]/g, "");

    if (!/^\+?\d{7,15}$/.test(normalized)) {
      return reply(
        "❌ Invalid phone number format!\n" +
        "Example: numberinfo +8801712345678"
      );
    }

    let loading;

    try {
      loading = await new Promise(resolve => {
        api.sendMessage(
          "🔍 𝐒𝐄𝐀𝐑𝐂𝐇𝐈𝐍𝐆 𝐍𝐔𝐌𝐁𝐄𝐑...\n━━━━━━━━━━━━━━━━━━",
          threadID,
          (err, info) => resolve(err ? null : info)
        );
      });

      const parsed = parsePhoneNumberFromString(normalized);

      if (!parsed) {
        throw new Error("Unable to parse phone number");
      }

      const countryCode = "+" + parsed.countryCallingCode;
      const countryISO = parsed.country || "Unknown";
      const international = parsed.formatInternational();
      const national = parsed.formatNational();
      const valid = parsed.isValid();
      const possible = parsed.isPossible();

      let country = countryISO;
      let capital = "Unknown";
      let region = "Unknown";
      let timezones = "Unknown";
      let flag = "🌍";

      // Country details from REST Countries API
      if (countryISO !== "Unknown") {
        try {
          const res = await axios.get(
            "https://restcountries.com/v3.1/alpha/" +
              encodeURIComponent(countryISO),
            {
              params: {
                fields: "name,capital,region,timezones,flag"
              },
              timeout: 10000
            }
          );

          const data = res.data?.[0];

          if (data) {
            country = data.name?.common || country;
            capital = data.capital?.join(", ") || "Unknown";
            region = data.region || "Unknown";
            timezones = data.timezones?.join(", ") || "Unknown";
            flag = data.flag || flag;
          }
        } catch (_) {}
      }

      // Match the supplied number against the user's own contacts.
      // Expected contacts.json format:
      // [
      //   {"name":"Example","phone":"+8801712345678"}
      // ]
      const contactsPath = path.join(__dirname, "contacts.json");
      let contactName = "Not found in your contacts";

      if (fs.existsSync(contactsPath)) {
        try {
          const raw = fs.readFileSync(contactsPath, "utf8");
          const contacts = JSON.parse(raw);

          if (Array.isArray(contacts)) {
            const targetDigits = normalized.replace(/\D/g, "");

            const found = contacts.find(contact => {
              if (!contact || typeof contact.phone !== "string") {
                return false;
              }

              const contactDigits = contact.phone.replace(/\D/g, "");

              return (
                contactDigits === targetDigits ||
                contactDigits.endsWith(targetDigits) ||
                targetDigits.endsWith(contactDigits)
              );
            });

            if (found && typeof found.name === "string") {
              contactName = found.name;
            }
          }
        } catch (err) {
          console.error("[CONTACTS ERROR]", err.message);
          contactName = "Could not read contacts.json";
        }
      }

      // Facebook search URL only opens public search.
      // It does not reveal a private profile or confirm ownership.
      const fbSearch =
        "https://www.facebook.com/search/top/?q=" +
        encodeURIComponent(international);

      const googleSearch =
        "https://www.google.com/search?q=" +
        encodeURIComponent('"' + international + '"');

      const message =
        "╭━━━『 📱 𝐍𝐔𝐌𝐁𝐄𝐑 𝐈𝐍𝐅𝐎 』━━━╮\n" +
        "┃\n" +
        `┃ ${flag} Country: ${country}\n` +
        `┃ 🔢 Country Code: ${countryCode}\n` +
        `┃ ☎️ International: ${international}\n` +
        `┃ 📝 National Format: ${national}\n` +
        `┃ 🏛️ Capital: ${capital}\n` +
        `┃ 🗺️ Region: ${region}\n` +
        `┃ 🕒 Timezone: ${timezones}\n` +
        `┃ ✅ Valid: ${valid ? "Yes" : "No / Unconfirmed"}\n` +
        `┃ 📌 Possible: ${possible ? "Yes" : "No"}\n` +
        `┃ 📡 Number Type: ${parsed.getType() || "Unknown"}\n` +
        "┃\n" +
        "┣━━━━━━━━━━━━━━━━━━\n" +
        "┃ 👥 Contact Name: " + contactName + "\n" +
        "┃ 👤 Owner Name: Not publicly verified\n" +
        "┃ 🆔 Facebook ID: Not verified\n" +
        "┃ 📡 Current Operator: Not verified\n" +
        "┃\n" +
        "┣━━━━━━━━━━━━━━━━━━\n" +
        "┃ 🔎 Facebook Public Search:\n" +
        fbSearch + "\n" +
        "┃\n" +
        "┃ 🌐 Web Search:\n" +
        googleSearch + "\n" +
        "┃\n" +
        "╰━━━『 𝐌𝐀𝐃𝐄 𝐁𝐘 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 』━━━╯";

      return editOrReply(message, loading);

    } catch (error) {
      console.error("[NUMBERINFO ERROR]", error.message);

      return editOrReply(
        "╭━━━『 ⚠️ 𝐍𝐔𝐌𝐁𝐄𝐑 𝐈𝐍𝐅𝐎 』━━━╮\n" +
        "┃ ❌ Lookup failed!\n" +
        "┃ Check the number format.\n" +
        "┃ Ensure dependencies are installed.\n" +
        "╰━━━『 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 』━━━╯",
        loading
      );
    }
  }
};
