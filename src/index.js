"use strict";

const User = require("./user");
const readline = require("readline");
const fetch = require("node-fetch");

const Relationship = {
    Friend: 1,
    Blocked: 2
};

const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function toSQL(blockedAndNotes) {
    return Array.from(blockedAndNotes.values()).map(user => user.toSQL()).join("\n");
}

async function fixUsernames(blockedAndNotes, headers) {
    for (const blocked of blockedAndNotes) {
        if (blocked[1].username === null) {
            const userResponse = await fetch(`https://discordapp.com/api/v8/users/${blocked[1].snowflake}/profile`, headers);
            const response = await userResponse.json();
            response.user = response.user || {username: null, discriminator: null};
            blocked[1].username = buildUsername(response.user);
            blockedAndNotes.set(blocked[0], blocked[1]);
        }
    }
}

function buildUsername(user) {
    if (user.username) {
        return user.username + "#" + user.discriminator;
    } else {
        return null;
    }
}

terminal.question("Please enter your OAuth Token: ", async answer => {
    console.log("Token is", answer);
    terminal.close();

    const headers = {
        "credentials": "include",
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US",
            "authorization": answer,
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin"
        },
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors"
    };

    const notesResponse = await fetch("https://discordapp.com/api/v8/users/@me/notes", headers);
    const notes = await notesResponse.json();

    const relationshipResponse = await fetch("https://discordapp.com/api/v8/users/@me/relationships", headers);
    const relationships = await relationshipResponse.json();

    const blockedAndNotes = new Map();

    for (const note of Object.keys(notes)) {
        blockedAndNotes.set(note, new User(null,
            note,
            notes[note],
            false)
        );
    }

    for (const relationship of relationships) {
        let user = blockedAndNotes.get(relationship.id);
        if (user) {
            user.username = buildUsername(relationship.user);
            user.blocked = relationship.type === Relationship.Blocked;
        } else {
            user = new User(buildUsername(relationship.user),
                relationship.id,
                null,
                relationship.type === Relationship.Blocked);
        }
        blockedAndNotes.set(relationship.id, user);
    }

    await fixUsernames(blockedAndNotes, headers);

    console.log(toSQL(blockedAndNotes));

    terminal.close();
});
