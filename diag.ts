
import { getOdinFullData } from "./src/lib/server.functions";

async function run() {
    console.log("Starting backend diagnostic...");
    try {
        const result = await getOdinFullData();
        console.log("SUCCESS:", result.success);
        if (result.success) {
            console.log("Counts:");
            console.log("- Customers:", result.data.customers.length);
            console.log("- Servers:", result.data.servers.length);
            console.log("- Streams:", result.data.streams.length);
            console.log("- Resellers:", result.data.resellers.length);
            if (result.data.customers.length > 0) {
                console.log("First customer username:", result.data.customers[0].username);
            }
        } else {
            console.log("ERROR:", result.error);
        }
    } catch (e) {
        console.error("CRITICAL ERROR:", e);
    }
}

run();
