import { getInstallScript } from './src/lib/server.functions';
async function main() {
  try {
    const script = await getInstallScript();
    console.log('--- SCRIPT START ---');
    console.log(script);
    console.log('--- SCRIPT END ---');
  } catch (e) {
    console.error('Error:', e);
  }
}
main();
