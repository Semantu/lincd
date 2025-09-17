import {InMemoryStore} from './storage.test.js';
import {QuadSet} from '../collections/QuadSet.js';
import {LinkedStorage} from '../utils/LinkedStorage.js';
import {runQueryTests, testEntities} from './utils/query-tests.js';

const quads = new QuadSet();
testEntities.forEach((p) => {
  quads.addFrom(p.getAllQuads());
});
LinkedStorage.setQuadsLoaded(quads);

//required for testing automatic data loading in linked components
const store = new InMemoryStore();
LinkedStorage.setDefaultStore(store);
store.addMultiple(quads);

runQueryTests();
