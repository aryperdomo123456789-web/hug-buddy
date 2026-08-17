import { getOdinFullData } from "./src/lib/server.functions";

async function run() {
  console.log("Triggering fetch...");
  const result = await getOdinFullData();
  console.log("RESULT SUCCESS:", result.success);
  if (result.success) {
    console.log("CUSTOMERS:", result.data.customers.length);
    console.log("SERVERS:", result.data.servers.length);
  } else {
    console.log("ERROR:", result.error);
  }
}

run();
