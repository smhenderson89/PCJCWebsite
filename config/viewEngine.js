import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname workaround for ES modules:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function setupViewEngine(app) {
  app.set('views', path.join(__dirname, '../views'));
  app.set('view engine', 'ejs');
}