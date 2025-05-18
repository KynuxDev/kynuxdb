'use strict';

const Benchmark = require('benchmark');
const db = require('../file/index.js');
const fs = require('fs');

const benchmarkSuite = new Benchmark.Suite();

const DB_FOLDER = './kynuxdb_benchmark_data';

function setupBenchmarkDbFolder() {
  if (fs.existsSync(DB_FOLDER)) {
    fs.rmSync(DB_FOLDER, { recursive: true, force: true });
  }
  fs.mkdirSync(DB_FOLDER, { recursive: true });
}

function cleanupBenchmarkDbFolder() {
  if (fs.existsSync(DB_FOLDER)) {
    fs.rmSync(DB_FOLDER, { recursive: true, force: true });
  }
}

const ITERATIONS = 1000;

const jsonDbInstance = Object.create(db);
jsonDbInstance.configureFolder(DB_FOLDER);
jsonDbInstance.configureFileName('benchmark_json');
jsonDbInstance.configureAdapter('jsondb');

benchmarkSuite.add('JSONDB#set', {
  defer: true,
  fn: async function (deferred) {
    for (let i = 0; i < ITERATIONS; i++) {
      await jsonDbInstance.set(`user${i}`, { name: 'Kynux', age: i });
    }
    deferred.resolve();
  },
  onStart: () => {
    jsonDbInstance.deleteAll();
  },
});

benchmarkSuite.add('JSONDB#get', {
  defer: true,
  fn: async function (deferred) {
    for (let i = 0; i < ITERATIONS; i++) {
      await jsonDbInstance.get(`user${i}`);
    }
    deferred.resolve();
  },
  onStart: async () => {
    await jsonDbInstance.deleteAll();
    for (let i = 0; i < ITERATIONS; i++) {
      await jsonDbInstance.set(`user_get_${i}`, { name: 'KynuxGet', age: i });
    }
  },
});

const yamlDbInstance = Object.create(db);
yamlDbInstance.configureFolder(DB_FOLDER);
yamlDbInstance.configureFileName('benchmark_yaml');
yamlDbInstance.configureAdapter('yamldb');

benchmarkSuite.add('YamlDB#set', {
  defer: true,
  fn: async function (deferred) {
    for (let i = 0; i < ITERATIONS; i++) {
      await yamlDbInstance.set(`user${i}`, { name: 'KynuxYAML', age: i });
    }
    deferred.resolve();
  },
  onStart: () => {
    yamlDbInstance.deleteAll();
  },
});

benchmarkSuite.add('YamlDB#get', {
  defer: true,
  fn: async function (deferred) {
    for (let i = 0; i < ITERATIONS; i++) {
      await yamlDbInstance.get(`user${i}`);
    }
    deferred.resolve();
  },
  onStart: async () => {
    await yamlDbInstance.deleteAll();
    for (let i = 0; i < ITERATIONS; i++) {
      await yamlDbInstance.set(`user_get_${i}`, {
        name: 'KynuxYAMLGet',
        age: i,
      });
    }
  },
});

const MONGO_URL = process.env.KYNUXDB_MONGO_BENCHMARK_URL;
if (MONGO_URL) {
  const mongoDbInstance = Object.create(db);
  mongoDbInstance.configureAdapter('mongo', {
    url: MONGO_URL,
    schema: 'KynuxBenchmarkTest',
  });

  const mongoReadyPromise = new Promise((resolve) => {
    if (mongoDbInstance._currentAdapterInstance.ready) {
      resolve();
    } else {
      mongoDbInstance._currentAdapterInstance.on('ready', resolve);
      mongoDbInstance._currentAdapterInstance.on('error', () => resolve());
    }
  });

  benchmarkSuite.add('MongoDB#set', {
    defer: true,
    fn: async function (deferred) {
      await mongoReadyPromise;
      if (!mongoDbInstance._currentAdapterInstance.ready) {
        console.warn('MongoDB not ready, skipping set benchmark.');
        deferred.resolve();
        return;
      }
      for (let i = 0; i < ITERATIONS; i++) {
        await mongoDbInstance.set(`user${i}`, { name: 'KynuxMongo', age: i });
      }
      deferred.resolve();
    },
    onStart: async () => {
      await mongoReadyPromise;
      if (mongoDbInstance._currentAdapterInstance.ready) {
        await mongoDbInstance.deleteAll();
      }
    },
  });

  benchmarkSuite.add('MongoDB#get', {
    defer: true,
    fn: async function (deferred) {
      await mongoReadyPromise;
      if (!mongoDbInstance._currentAdapterInstance.ready) {
        console.warn('MongoDB not ready, skipping get benchmark.');
        deferred.resolve();
        return;
      }
      for (let i = 0; i < ITERATIONS; i++) {
        await mongoDbInstance.get(`user${i}`);
      }
      deferred.resolve();
    },
    onStart: async () => {
      await mongoReadyPromise;
      if (mongoDbInstance._currentAdapterInstance.ready) {
        await mongoDbInstance.deleteAll();
        for (let i = 0; i < ITERATIONS; i++) {
          await mongoDbInstance.set(`user_get_${i}`, {
            name: 'KynuxMongoGet',
            age: i,
          });
        }
      }
    },
  });
} else {
  console.warn(
    'MongoDB benchmark skipped. Set KYNUXDB_MONGO_BENCHMARK_URL environment variable to run.'
  );
}

benchmarkSuite
  .on('start', function () {
    console.log('Benchmark suite starting...');
    setupBenchmarkDbFolder();
  })
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Benchmark suite complete.');
    console.log('Fastest is ' + this.filter('fastest').map('name'));
    cleanupBenchmarkDbFolder();
  })
  .on('error', function (event) {
    console.error('Benchmark error:', event.target.error);
    cleanupBenchmarkDbFolder();
  })
  .run({ async: true });
