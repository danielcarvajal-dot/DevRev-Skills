import * as fs from 'fs';
import * as path from 'path';

describe('catalog sync', () => {
  it('keeps the snap-in catalog identical to scripts/catalog.json', () => {
    const repo = path.resolve(__dirname, '../../..');
    const scriptsCatalog = JSON.parse(fs.readFileSync(path.join(repo, 'scripts/catalog.json'), 'utf8'));
    const snapCatalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalog.json'), 'utf8'));
    expect(snapCatalog).toEqual(scriptsCatalog);
  });
});
