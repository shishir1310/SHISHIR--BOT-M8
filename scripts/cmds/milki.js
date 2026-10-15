module.exports = {
config: {
name: "milki",
version: "1.0",
author: "SHISHIR",
countDown: 5,
role: 0,
description: {
en: "Get target profile picture"
},
category: "fun",
guide: {
en: "{pn} @mention\n{pn} <uid>\nReply to a message with {pn}"
}
},

onStart: async function ({ api, event, args, message }) {
	const { senderID, mentions, messageReply } = event;
	let targetID;

	if (messageReply) {
		targetID = messageReply.senderID;
	} else if (Object.keys(mentions).length > 0) {
		targetID = Object.keys(mentions)[0];
	} else if (args[0] && /^\d+$/.test(args[0])) {
		targetID = args[0];
	} else {
		targetID = senderID;
	}

	try {
		const userInfo = await api.getUserInfo(targetID);
		const user = userInfo?.[targetID];
		const name = user?.name || "User";

		const avatarURL =
			`https://graph.facebook.com/${targetID}/picture?width=1024&height=1024`;

		const stream = await global.utils.getStreamFromURL(avatarURL);

		return message.reply({
			body: `🖼️ 𝐍𝐚𝐦𝐞: ${name}\n🆔 𝐔𝐈𝐃: ${targetID}\n\n𝐌𝐀𝐃𝐄 𝐁𝐘 𝐒𝐇𝐈𝐒𝐇𝐈𝐑`,
			attachment: stream
		});
	} catch (err) {
		console.error("Milki Error:", err);
		return message.reply(
			"❌ Profile picture আনতে সমস্যা হয়েছে। আবার চেষ্টা করো।"
		);
	}
}

};
