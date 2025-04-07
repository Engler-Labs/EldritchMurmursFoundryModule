
Hooks.once("init", () => {
  game.settings.register("external-api-forwarder", "apiKey", {
    name: "External API Key",
    hint: "Only the GM can set this. It will be used in all outgoing requests.",
    scope: "world",
    config: game.user.isGM,  // Only visible in settings UI to GM
    type: String,
    default: ""
  });
});

async function sendToExternalAPI(payload) {
  const apiKey = game.settings.get("external-api-forwarder", "apiKey");

  await fetch("https://eldritch-murmurs.englerlabs.com/v0/foundry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey
    },
    body: JSON.stringify(payload)
  });
}

Hooks.on("createChatMessage", async (message, options, userId) => {
  const payload = {
    event: "createChatMessage",
    userId,
    content: message.content,
    speaker: message.speaker,
    isRoll: message.isRoll,
    rolls: message.rolls || [],
    timestamp: Date.now()
  };

  await sendToExternalAPI(payload);
});

Hooks.on("updateActor", async (actor, changedData, options, userId) => {
  const payload = {
    event: "updateActor",
    userId,
    actorId: actor.id,
    actorName: actor.name,
    changedData,
    timestamp: Date.now()
  };

  await sendToExternalAPI(payload);
});

Hooks.once("ready", async () => {
  const users = game.users.contents.map(user => ({
    id: user.id,
    name: user.name,
    isGM: user.isGM,
    active: user.active
  }));

  await sendToExternalAPI({
    event: "initialUserList",
    users,
    timestamp: Date.now()
  });
});

Hooks.on("createUser", async (user, options, userId) => {
  const newUser = {
    id: user.id,
    name: user.name,
    isGM: user.isGM,
    active: user.active
  };

  await sendToExternalAPI({
    event: "newUserJoined",
    user: newUser,
    timestamp: Date.now()
  });
});
