const silenceLocal = true; //skip webhook in local instance
//[Imports]
const chalk = require("chalk").default;
if (chalk.level === 0) chalk.level = 1; //fix for fly/docker
//[Variables]
const { APP_NAME, APP_AVATAR, WEBHOOK_URL } = process.env;
const contentFormatting = (log) => {
  const formattedMsg = log.replace(/\x1B\[(\d+)m/g, (_, code) => `\u001b[2;${code}m`).replaceAll("\u001b[2;92m", "\u001b[2;32m"); //Discord has "yellowish green" instead of "brightGreen"
  return `\`\`\`ansi\n${formattedMsg}\n\`\`\``;
};

async function sendWebhook(body) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response;
}

//[Send webhook log]
module.exports = async (message, appName, appAvatar, webhookMsg) => {
  console.log(message);
  if (process.env.LOCAL && silenceLocal) return;

  if (!WEBHOOK_URL) return;
  const username = appName || APP_NAME || "Url Shortener";
  const avatar_url = appAvatar || APP_AVATAR || null;
  const content = contentFormatting(webhookMsg || message || "I was supposed to send a message, but I got nothing.");

  const payload = { username, content };
  if (avatar_url) payload.avatar_url = avatar_url;

  try {
    let response = await sendWebhook(payload);
    //couldn't send
    if (!response.ok) {
      if (avatar_url && response.status === 400) {
        return await sendWebhook({ username, content });
      }
      const errText = await response.text();
      console.error(`Webhook send failed (${response.status}): ${errText}`);
    }
  } catch (error) {
    console.error(error);
  }
};
