"use strict";

module.exports = class User {
    username;
    snowflake;
    note;
    blocked;

    constructor(username, snowflake, note, blocked) {
        this.username = username;
        this.snowflake = snowflake;
        this.note = note;
        this.blocked = blocked;
    }

    toSQL() {
        return `INSERT IGNORE INTO \`BlockedUsers\` VALUES ('0', '${(this.username || "null").replace("'", "\\'")}', '${this.snowflake}', '${(this.note || "").replace("'", "\\'")}', '${this.blocked ? 1 : 0}') ON DUPLICATE KEY UPDATE \`id\` = VALUES(\`id\`), \`username\` = VALUES(\`username\`), \`snowflake\` = VALUES(\`snowflake\`), \`note\` = VALUES(\`note\`), \`blocked\` = VALUES(\`blocked\`);`;
    }
}
