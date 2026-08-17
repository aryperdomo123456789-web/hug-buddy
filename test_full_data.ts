import { getOdinFullData } from "./src/lib/server.functions";

async function run() {
  console.log("Calling getOdinFullData...");
  const result = await getOdinFullData();
  console.log("Success:", result.success);
  if (result.success) {
    console.log("Users:", result.data.customers.length);
    console.log("Servers:", result.data.servers.length);
    console.log("Resellers:", result.data.resellers.length);
  } else {
    console.log("Error:", result.error);
  }
}

run();
