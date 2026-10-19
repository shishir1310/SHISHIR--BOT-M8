const axios = require("axios");

module.exports = {
  config: {
    name: "country",
    version: "2.0.0",
    role: 0,
    hasPrefix: true,
    credits: "SHISHIR",
    description: "Get detailed information about any country",
    usage: "[country name]",
    cooldown: 5
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const countryName = args.join(" ").trim();

    if (!countryName) {
      return api.sendMessage(
        "🌍 ━━━『 𝐂𝐎𝐔𝐍𝐓𝐑𝐘 』━━━\n\n" +
        "❌ Please enter a country name!\n\n" +
        "📌 Example: country Bangladesh\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "⚡ 𝐌𝐀𝐃𝐄 𝐁𝐘 𝐒𝐇𝐈𝐒𝐇𝐈𝐑",
        threadID,
        messageID
      );
    }

    let searchingMsg;

    try {
      searchingMsg = await new Promise((resolve) => {
        api.sendMessage(
          `🔍 𝐒𝐄𝐀𝐑𝐂𝐇𝐈𝐍𝐆...\n\n🌍 Country: ${countryName}`,
          threadID,
          (err, info) => resolve(err ? null : info)
        );
      });

      const response = await axios.get(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`,
        { timeout: 15000 }
      );

      if (!Array.isArray(response.data) || !response.data.length) {
        throw new Error("Country not found");
      }

      // Find the best matching country
      const countries = response.data;
      const query = countryName.toLowerCase();

      const data =
        countries.find(c => c.name?.common?.toLowerCase() === query) ||
        countries.find(c => c.name?.official?.toLowerCase() === query) ||
        countries[0];

      const name = data.name?.common || "N/A";
      const officialName = data.name?.official || "N/A";
      const capital = data.capital?.join(", ") || "N/A";
      const region = data.region || "N/A";
      const subregion = data.subregion || "N/A";
      const population =
        typeof data.population === "number"
          ? data.population.toLocaleString("en-US")
          : "N/A";

      const area =
        typeof data.area === "number"
          ? `${data.area.toLocaleString("en-US")} km²`
          : "N/A";

      const currencies = data.currencies
        ? Object.values(data.currencies)
            .map(c => `${c.name} (${c.symbol || "N/A"})`)
            .join(", ")
        : "N/A";

      const languages = data.languages
        ? Object.values(data.languages).join(", ")
        : "N/A";

      const continents = data.continents?.join(", ") || "N/A";
      const timezones = data.timezones?.join(", ") || "N/A";

      const independent =
        typeof data.independent === "boolean"
          ? data.independent ? "Yes ✅" : "No ❌"
          : "N/A";

      const unMember =
        typeof data.unMember === "boolean"
          ? data.unMember ? "Yes ✅" : "No ❌"
          : "N/A";

      const flag = data.flag || "🌍";
      const domain = data.tld?.join(", ") || "N/A";
      const drivingSide = data.car?.side || "N/A";
      const startOfWeek = data.startOfWeek || "N/A";

      const message =
        `╭━━━『 🌍 𝐂𝐎𝐔𝐍𝐓𝐑𝐘 』━━━╮\n` +
        `┃\n` +
        `┃ ${flag} 𝐍𝐚𝐦𝐞: ${name}\n` +
        `┃\n` +
        `┣━━━━━━━━━━━━━━━━━━\n` +
        `┃ 📜 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥 𝐍𝐚𝐦𝐞\n` +
        `┃ ${officialName}\n` +
        `┃\n` +
        `┃ 🏛️ 𝐂𝐚𝐩𝐢𝐭𝐚𝐥: ${capital}\n` +
        `┃ 🌎 𝐂𝐨𝐧𝐭𝐢𝐧𝐞𝐧𝐭: ${continents}\n` +
        `┃ 🗺️ 𝐑𝐞𝐠𝐢𝐨𝐧: ${region}\n` +
        `┃ 📍 𝐒𝐮𝐛𝐫𝐞𝐠𝐢𝐨𝐧: ${subregion}\n` +
        `┃\n` +
        `┣━━━━━━━━━━━━━━━━━━\n` +
        `┃ 👥 𝐏𝐨𝐩𝐮𝐥𝐚𝐭𝐢𝐨𝐧: ${population}\n` +
        `┃ 📐 𝐀𝐫𝐞𝐚: ${area}\n` +
        `┃ 💰 𝐂𝐮𝐫𝐫𝐞𝐧𝐜𝐲: ${currencies}\n` +
        `┃ 🗣️ 𝐋𝐚𝐧𝐠𝐮𝐚𝐠𝐞: ${languages}\n` +
        `┃ 🕒 𝐓𝐢𝐦𝐞𝐳𝐨𝐧𝐞: ${timezones}\n` +
        `┃ 🌐 𝐃𝐨𝐦𝐚𝐢𝐧: ${domain}\n` +
        `┃ 🚘 𝐃𝐫𝐢𝐯𝐢𝐧𝐠 𝐒𝐢𝐝𝐞: ${drivingSide}\n` +
        `┃ 📅 𝐖𝐞𝐞𝐤 𝐒𝐭𝐚𝐫𝐭𝐬: ${startOfWeek}\n` +
        `┃\n` +
        `┣━━━━━━━━━━━━━━━━━━\n` +
        `┃ 🏳️ 𝐈𝐧𝐝𝐞𝐩𝐞𝐧𝐝𝐞𝐧𝐭: ${independent}\n` +
        `┃ 🇺🇳 𝐔𝐍 𝐌𝐞𝐦𝐛𝐞𝐫: ${unMember}\n` +
        `┃\n` +
        `╰━━━『 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 』━━━╯`;

      if (searchingMsg?.messageID && typeof api.editMessage === "function") {
        return api.editMessage(message, searchingMsg.messageID);
      }

      return api.sendMessage(message, threadID, messageID);

    } catch (error) {
      console.error("[COUNTRY ERROR]", error.message);

      const errorMsg =
        `╭━━━『 ⚠️ 𝐄𝐑𝐑𝐎𝐑 』━━━╮\n` +
        `┃ ❌ Country not found!\n` +
        `┃ 🔎 Name: ${countryName}\n` +
        `┃\n` +
        `┃ Please check the spelling\n` +
        `┃ or try another country name.\n` +
        `╰━━━『 𝐒𝐇𝐈𝐒𝐇𝐈𝐑 』━━━╯`;

      if (searchingMsg?.messageID && typeof api.editMessage === "function") {
        return api.editMessage(errorMsg, searchingMsg.messageID);
      }

      return api.sendMessage(errorMsg, threadID, messageID);
    }
  }
};
