import { client } from "../../src/config/client";
import { startTunnel } from "../../src/db-tunnel";

async function main() {
    await startTunnel();
    await client.profile_app_profile.update({
        where: {
            user_id: 3
        },
        data: {
            pseudonym: "Artem"
        }
    });
}

main();
