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
            const userResponse = await fetch(`https://discordapp.com/api/v6/users/${blocked[1].snowflake}/profile`, headers);
            const response = await userResponse.json();
            response.user = response.user || { username: null };
            blocked[1].username = response.user.username;
            blockedAndNotes.set(blocked[0], blocked[1]);
        }
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

    const notesResponse = await fetch("https://discordapp.com/api/v6/users/@me/notes", headers);
    const notes = await notesResponse.json();

    const relationshipResponse = await fetch("https://discordapp.com/api/v6/users/@me/relationships", headers);
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
            user.username = relationship.user.username;
            user.blocked = relationship.type === Relationship.Blocked;
        } else {
            user = new User(relationship.user.username,
                relationship.id,
                null,
                relationship.type === Relationship.Blocked);
        }
        blockedAndNotes.set(relationship.id, user);
    }

    await fixUsernames(blockedAndNotes, headers);

    console.log(toSQL(blockedAndNotes));

    process.exit();
});
