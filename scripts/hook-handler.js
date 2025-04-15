import {EldritchMurmursFoundryEvents} from './dataclasses/EldritchMurmursFoundryEvents.mjs'


Hooks.once("init", () => {

});

async function sendToExternalAPI(payload) {
    const apiKey = game.settings.get("external-api-forwarder", "apiKey");
    console.log(apiKey);

    console.log(payload);
    const payload_to_send = {
        ...payload,
        session_id: game.sessionId,
        game_system: game.system.title,
        world_id: game.world.id,
        world_title: game.world.title,
        campaign_id: game.settings.get("campaign-identifier", "campaignId"),
    };

    await fetch("https://eldritch-murmurs.englerlabs.com/v0/foundry", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey || ""
        },
        body: JSON.stringify(payload_to_send)
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // or response.text() if the response is not JSON
    })
        .then(data => {
            console.log('Data received:', data);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

Hooks.on("createChatMessage", async (message, options, userId) => {
    const payload = {
        event: "createChatMessage",
        userId: userId,
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
        userId: userId,
        actorId: actor.id,
        actorName: actor.name,
        changedData: changedData,
        timestamp: Date.now()
    };

    await sendToExternalAPI(payload);
});

Hooks.once("ready", async () => {
    game.settings.register("external-api-forwarder", "apiKey", {
        name: "Eldritch Murmurs API Key",
        hint: "Only the GM can set this. It will be used in all outgoing requests.",
        scope: "world",
        config: game.users.current.isGM,  // Only visible in settings UI to GM
        type: String,
        default: ""
    });

    game.settings.register("campaign-identifier", "campaignId", {
        name: "Eldritch Murmurs Campaign Identifier",
        hint: "Campaign ID",
        scope: "world",
        config: game.users.current.isGM,
        type: String,
        default: ""
    });

    const users = game.users.contents.map(user => ({
        id: user.id,
        name: user.name,
        isGM: user.isGM,
        active: user.active
    }));

    await sendToExternalAPI({
        event: "initialUserList",
        users: users,
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
