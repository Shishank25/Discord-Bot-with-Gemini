import { readdirSync } from 'fs';
import { pathToFileURL } from 'url';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadEvents(client) {
  const eventsPath = join(__dirname, '../events');
  const eventFiles = readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const fileUrl = pathToFileURL(filePath).href;
    const event = await import(fileUrl);
    
    if (event.default?.name) {
      if (event.default.once) {
        client.once(event.default.name, (...args) => 
          event.default.execute(...args)
        );
      } else {
        client.on(event.default.name, (...args) => 
          event.default.execute(...args)
        );
      }
      console.log(`✓ Loaded event: ${event.default.name}`);
    }
  }
}