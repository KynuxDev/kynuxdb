# KynuxDB

[![Downloads](https://img.shields.io/npm/d18m/%40kynuxcloud%2Fkynuxdb?style=flat-square)](https://www.npmjs.com/package/@kynuxcloud/kynuxdb)
[![License](https://img.shields.io/npm/l/%40kynuxcloud%2Fkynuxdb?style=flat-square)](https://github.com/kynuxdev/kynuxdb/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/%40kynuxcloud%2Fkynuxdb?style=flat-square)](https://www.npmjs.com/package/%40kynuxcloud%2Fkynuxdb)

KynuxDB, Node.js uygulamaları için esnek ve kullanımı kolay bir veri depolama modülüdür. Farklı depolama adaptörlerini destekler.

## ✨ Özellikler

*   **Kolay Kullanım:** Basit ve anlaşılır API.
*   **Çoklu Adaptör Desteği:** JSON (varsayılan), YAML, LocalStorage (web) ve MongoDB adaptörleri.
*   **Esnek Veri Yapıları:** Nesneler, diziler, sayılar ve string'ler ile çalışabilme.
*   **Dot Notation Desteği:** İç içe geçmiş verilere kolay erişim (`'user.profile.name'`).
*   **Yapılandırma Seçenekleri:** Dosya/klasör adı, okunabilirlik formatı gibi ayarlar.
*   **Veri İçe Aktarma:** Diğer kaynaklardan (örneğin quick.db) veri taşıma imkanı.
*   **Alan Seçimi (Projeksiyon):** Sorgu sonuçlarında sadece istenen alanların döndürülmesini sağlar.
*   **TypeScript Desteği:** Tamamen yazılmış TypeScript tanımlamaları ile birlikte gelir.

## 💾 Desteklenen Adaptörler

*   **JSON** (Varsayılan): Verileri `.json` dosyasında saklar.
*   **YAML**: Verileri `.yaml` dosyasında saklar (`yaml` paketi gerektirir).
*   **LocalStorage**: Verileri tarayıcının LocalStorage'ında saklar (Web ortamı için).
*   **MongoDB**: Verileri MongoDB veritabanında saklar (`mongoose` paketi gerektirir).

## 🚀 Kurulum

```bash
npm install @kynuxcloud/kynuxdb
```
Gerekli adaptörler için ek paketleri kurmayı unutmayın:
*   YAML için: `npm install yaml`
*   MongoDB için: `npm install mongoose`

## 💡 Kullanım

Tüm API metodları `Promise` döndürür.

### Temel İşlemler

```javascript
const db = require('@kynuxcloud/kynuxdb');

async function main() {
  // Veri Ayarlama
  await db.set('user.name', 'kynuxdev');
  await db.set('user.projects', ['kynuxdb']);
  console.log(await db.get('user.name')); // Çıktı: kynuxdev

  // Veri Alma
  console.log(await db.get('user'));
  // Çıktı: { name: 'kynuxdev', projects: [ 'kynuxdb' ] }
  console.log(await db.fetch('user.projects')); // Çıktı: [ 'kynuxdb' ]

  // Veri Kontrolü
  console.log(await db.has('user.name')); // Çıktı: true

  // Sayı Ekleme/Çıkarma
  await db.set('counter', 10);
  await db.add('counter', 5); // counter şimdi 15
  await db.subtract('counter', 3); // counter şimdi 12
  console.log(await db.get('counter')); // Çıktı: 12

  // Diziye Ekleme/Çıkarma
  await db.push('user.projects', 'new-project');
  console.log(await db.get('user.projects')); // Çıktı: [ 'kynuxdb', 'new-project' ]
  await db.unpush('user.projects', 'kynuxdb');
  console.log(await db.get('user.projects')); // Çıktı: [ 'new-project' ]

  // Veri Silme
  await db.delete('counter');
  console.log(await db.has('counter')); // Çıktı: false

  // Tüm Verileri Alma
  console.log(await db.all());

  // Tüm Verileri Silme
  // await db.deleteAll(); // Dikkatli kullanın!

  // Veri Bulma ve Alan Seçimi (Projeksiyon)
  await db.set('users', [
    { id: 1, name: 'Ali', age: 30, email: 'ali@example.com' },
    { id: 2, name: 'Veli', age: 25, email: 'veli@example.com' }
  ]);
  // Not: `find` metodu typings dosyasında bulunmuyor, ancak README'de örneği var.
  // Bu özelliğin çalıştığından emin olun veya typings dosyasını güncelleyin.
  const users = await db.find({ 'age': { '$gte': 25 } }, { projection: { name: 1, email: 1, _id: 0 } });
  console.log(users);
  // Çıktı (adaptöre göre değişebilir, MongoDB'de _id hariç):
  // [ { name: 'Ali', email: 'ali@example.com' }, { name: 'Veli', email: 'veli@example.com' } ]
}

main();
```

### Adaptör Kullanımı

**JSON (Varsayılan)**
```javascript
const db = require('@kynuxcloud/kynuxdb');
// Ekstra yapılandırma gerekmez
async function main() {
  await db.set('message', 'JSON\'dan Merhaba!');
  console.log(await db.get('message'));
}
main();
```

**YAML**
```javascript
const db = require('@kynuxcloud/kynuxdb');
db.configureAdapter('yamldb'); // YAML adaptörünü kullan
async function main() {
  await db.set('message', 'YAML\'dan Merhaba!');
  console.log(await db.get('message'));
}
main();
```

**LocalStorage (Web Ortamı)**
```javascript
// Tarayıcı ortamında çalıştığını varsayalım
const db = require('@kynuxcloud/kynuxdb');
db.configureAdapter('localstorage');
async function main() {
  await db.set('message', 'LocalStorage\'dan Merhaba!');
  console.log(await db.get('message'));
}
main(); // Tarayıcı konsolunda çalıştırın
```

**MongoDB**
```javascript
const db = require('@kynuxcloud/kynuxdb');
db.configureAdapter('mongo', {
  url: 'MONGODB_CONNECTION_URL_BURAYA', // MongoDB bağlantı adresiniz
  schema: 'KoleksiyonAdı' // Opsiyonel, varsayılan: 'KynuxDB'
});
async function main() {
  await db.set('message', 'MongoDB\'den Merhaba!');
  console.log(await db.get('message'));
}
main();
```

### Yapılandırma Seçenekleri

```javascript
const db = require('@kynuxcloud/kynuxdb');

// JSON/YAML dosyasını okunabilir yap (girintileme ekler)
db.configureReadableFormat(true);

// Silme işleminden sonra boş nesneleri otomatik kaldır
db.configureAutoPrune(true);

// Özel klasör/dosya adları ayarla (JSON/YAML için)
db.configureFolder('verilerim');
db.configureFileName('uygulamaVerisi'); // verilerim/uygulamaVerisi.json (veya .yaml) oluşturur

// Mesajlar için dil ayarla (varsayılan: 'en')
db.configureLanguage('tr'); // 'en' veya 'tr'
```

### Veri İçe Aktarma

```javascript
const db = require('@kynuxcloud/kynuxdb');
// const quickdb = require('quick.db'); // Örnek kaynak, projenize eklemeniz gerekir

// Örnek bir kaynak DB objesi (DataSource arayüzüne uygun olmalı)
const sourceDB_example = {
    fetchAll: () => [
        { ID: 'key1', data: 'value1' },
        { ID: 'key2', data: { nested: 'value2' } }
    ]
    // target ve table opsiyoneldir
};

async function main() {
  // Başka bir kaynaktan (örneğin quick.db veya uyumlu bir obje) veri içe aktar
  await db.importDataFrom(sourceDB_example); // quickdb yerine örnek objeyi kullandık
  console.log('Veri içe aktarma tamamlandı!');
  console.log(await db.all());
}
main();
```

## 📚 API Referansı

Tüm metodlar `Promise` döndürür.

*   `configureAdapter(adapterName: "jsondb"|"localstorage"|"mongo"|"yamldb", options?: object)`: Veritabanı adaptörünü ayarlar.
*   `configureLanguage(lang: "tr"|"en")`: Hata mesajları için dili ayarlar.
*   `configureReadableFormat(readable: boolean)`: Dosya adaptörleri için okunabilir formatlamayı etkinleştirir/devre dışı bırakır.
*   `configureAutoPrune(noBlankData: boolean)`: Boş nesnelerin otomatik kaldırılmasını etkinleştirir/devre dışı bırakır.
*   `configureFolder(folderPath: string)`: Dosya adaptörleri için klasör adını ayarlar.
*   `configureFileName(fileName: string)`: Dosya adaptörleri için dosya adını (uzantısız) ayarlar.
*   `set(key: string, value: unknown)`: Bir anahtar için değer ayarlar.
*   `get(key: string)`: Bir anahtarın değerini alır.
*   `fetch(key: string)`: Bir anahtarın değerini alır (get ile aynı).
*   `has(key: string)`: Bir anahtarın var olup olmadığını kontrol eder.
*   `delete(key: string)`: Bir anahtar-değer çiftini siler.
*   `add(key: string, value: number)`: Mevcut sayısal değere bir sayı ekler veya yoksa/sayısal değilse ayarlar.
*   `subtract(key: string, value: number)`: Mevcut sayısal değerden bir sayı çıkarır.
*   `push(key: string, value: unknown)`: Bir diziye değer ekler.
*   `unpush(key: string, value: unknown)`: Bir diziden belirli bir değeri kaldırır.
*   `delByPriority(key: string, index: number)`: Dizi elemanını indeksine göre siler (1 tabanlı). *Not: Typings dosyasındaki parametreler farklılık gösterebilir, bu README açıklamasına göredir.*
*   `setByPriority(key: string, value: unknown, index: number)`: Dizi elemanını indeksine göre ayarlar/günceller (1 tabanlı). *Not: Typings dosyasındaki parametreler farklılık gösterebilir, bu README açıklamasına göredir.*
*   `find(query: object, options?: object)`: Verilen sorgu ve seçeneklere göre verileri bulur. `options` içinde `sort` ve `projection` gibi seçenekler alabilir. *Not: Bu metod `typings/index.d.ts` dosyasında bulunmamaktadır.*
*   `all()`: Veritabanındaki tüm verileri alır.
*   `deleteAll()`: Veritabanındaki tüm verileri siler.
*   `importDataFrom(sourceDB: DataSource)`: Başka bir uyumlu veritabanı kaynağından veri içe aktarır. `DataSource` arayüzü `{ fetchAll: () => { ID: string; data: unknown }[]; target?: string | null; table?: string; }` şeklinde olmalıdır.

## 💻 Geliştirme (Development)

Projeye katkıda bulunmak veya yerel ortamınızda geliştirmek için aşağıdaki adımları izleyebilirsiniz.

### Kurulum
Projeyi klonlayın ve bağımlılıkları yükleyin:
```bash
git clone https://github.com/KynuxDev/kynuxdb.git
cd kynuxdb
npm install
```

### Kod Stili ve Linting
Proje ESLint ve Prettier kullanmaktadır. Kodunuzu kontrol etmek ve formatlamak için:
```bash
# Lint hatalarını kontrol et
npm run lint

# Lint hatalarını otomatik düzelt
npm run lint:fix

# Kodu Prettier ile formatla
npm run format
```

## 📊 Benchmarklar

Projenin performansını test etmek için benchmark testlerini çalıştırabilirsiniz:
```bash
npm run benchmark
```
Bu komut `benchmarks/basic_operations.js` dosyasını çalıştıracaktır.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen [GitHub](https://github.com/kynuxdev/kynuxdb) üzerinden issue açmaktan veya pull request göndermekten çekinmeyin.

## 💬 Destek

Sorularınız veya yardıma ihtiyacınız olursa [Discord sunucusuna](https://discord.gg/wCK5dVSY2n) katılabilirsiniz.

## 📜 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.
