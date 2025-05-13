# KynuxDB

[![Downloads](https://img.shields.io/npm/d18m/%40kynuxcloud%2Fkynuxdb)](https://www.npmjs.com/package/@kynuxcloud/kynuxdb)
[![License](https://img.shields.io/npm/l/kynuxdb.svg?style=flat-square)](https://github.com/kynuxdev/kynuxdb/blob/main/LICENSE)

KynuxDB, Node.js uygulamaları için esnek ve kullanımı kolay bir veri depolama modülüdür. Farklı depolama adaptörlerini destekler.

## ✨ Özellikler

*   **Kolay Kullanım:** Basit ve anlaşılır API.
*   **Çoklu Adaptör Desteği:** JSON (varsayılan), YAML, LocalStorage (web) ve MongoDB adaptörleri.
*   **Esnek Veri Yapıları:** Nesneler, diziler, sayılar ve string'ler ile çalışabilme.
*   **Dot Notation Desteği:** İç içe geçmiş verilere kolay erişim (`'user.profile.name'`).
*   **Yapılandırma Seçenekleri:** Dosya/klasör adı, okunabilirlik formatı gibi ayarlar.
*   **Veri İçe Aktarma:** Diğer kaynaklardan (örneğin quick.db) veri taşıma imkanı.

## 💾 Desteklenen Adaptörler

*   **JSON** (Varsayılan): Verileri `.json` dosyasında saklar.
*   **YAML**: Verileri `.yaml` dosyasında saklar (`yaml` paketi gerektirir).
*   **LocalStorage**: Verileri tarayıcının LocalStorage'ında saklar (Web ortamı için).
*   **MongoDB**: Verileri MongoDB veritabanında saklar (`mongoose` ve `deasync` paketleri gerektirir).

## 🚀 Kurulum

```bash
npm install kynuxdb
```
Gerekli adaptörler için ek paketleri kurmayı unutmayın:
*   YAML için: `npm install yaml`
*   MongoDB için: `npm install mongoose deasync`

## 💡 Kullanım

### Temel İşlemler

```javascript
const db = require('kynuxdb');

// Veri Ayarlama
db.set('user.name', 'kynuxdev');
db.set('user.projects', ['kynuxdb']);
console.log(db.get('user.name')); // Çıktı: kynuxdev

// Veri Alma
console.log(db.get('user'));
// Çıktı: { name: 'kynuxdev', projects: [ 'kynuxdb' ] }
console.log(db.fetch('user.projects')); // Çıktı: [ 'kynuxdb' ]

// Veri Kontrolü
console.log(db.has('user.name')); // Çıktı: true

// Sayı Ekleme/Çıkarma
db.set('counter', 10);
db.add('counter', 5); // counter şimdi 15
db.subtract('counter', 3); // counter şimdi 12
console.log(db.get('counter')); // Çıktı: 12

// Diziye Ekleme/Çıkarma
db.push('user.projects', 'new-project');
console.log(db.get('user.projects')); // Çıktı: [ 'kynuxdb', 'new-project' ]
db.unpush('user.projects', 'kynuxdb');
console.log(db.get('user.projects')); // Çıktı: [ 'new-project' ]

// Veri Silme
db.delete('counter');
console.log(db.has('counter')); // Çıktı: false

// Tüm Verileri Alma
console.log(db.all());

// Tüm Verileri Silme
// db.deleteAll(); // Dikkatli kullanın!
```

### Adaptör Kullanımı

**JSON (Varsayılan)**
```javascript
const db = require('kynuxdb');
// Ekstra yapılandırma gerekmez
db.set('message', 'JSON\'dan Merhaba!');
```

**YAML**
```javascript
const db = require('kynuxdb');
db.setAdapter('yamldb'); // YAML adaptörünü kullan
db.set('message', 'YAML\'dan Merhaba!');
```

**LocalStorage (Web Ortamı)**
```javascript
// Tarayıcı ortamında çalıştığını varsayalım
const db = require('kynuxdb');
db.setAdapter('localstorage');
db.set('message', 'LocalStorage\'dan Merhaba!');
```

**MongoDB**
```javascript
const db = require('kynuxdb');
db.setAdapter('mongo', {
  url: 'MONGODB_CONNECTION_URL_BURAYA', // MongoDB bağlantı adresiniz
  schema: 'KoleksiyonAdı' // Opsiyonel, varsayılan: 'KynuxDB'
});
db.set('message', 'MongoDB\'den Merhaba!');
```

### Yapılandırma Seçenekleri

```javascript
const db = require('kynuxdb');

// JSON/YAML dosyasını okunabilir yap (girintileme ekler)
db.setReadable(true);

// Silme işleminden sonra boş nesneleri otomatik kaldır
db.setNoBlankData(true);

// Özel klasör/dosya adları ayarla (JSON/YAML için)
db.setFolder('verilerim');
db.setFile('uygulamaVerisi'); // verilerim/uygulamaVerisi.json (veya .yaml) oluşturur

// Mesajlar için dil ayarla (varsayılan: 'en')
db.setLanguage('tr');
```

### Veri İçe Aktarma

```javascript
const db = require('kynuxdb');
const quickdb = require('quick.db'); // Örnek kaynak

// Başka bir kaynaktan (örneğin quick.db) veri içe aktar
db.importDataFrom(quickdb);
console.log('Veri içe aktarma tamamlandı!');
```

## 📚 API Referansı

*   `setAdapter(adapterName, options)`: Veritabanı adaptörünü ayarlar.
*   `setLanguage(lang)`: Hata mesajları için dili ayarlar ('en' veya 'tr').
*   `setReadable(boolean)`: Dosya adaptörleri için okunabilir formatlamayı etkinleştirir/devre dışı bırakır.
*   `setNoBlankData(boolean)`: Boş nesnelerin otomatik kaldırılmasını etkinleştirir/devre dışı bırakır.
*   `setFolder(folderName)`: Dosya adaptörleri için klasör adını ayarlar.
*   `setFile(fileName)`: Dosya adaptörleri için dosya adını (uzantısız) ayarlar.
*   `set(key, value)`: Bir anahtar için değer ayarlar.
*   `get(key)`, `fetch(key)`: Bir anahtarın değerini alır.
*   `has(key)`: Bir anahtarın var olup olmadığını kontrol eder.
*   `delete(key)`: Bir anahtar-değer çiftini siler.
*   `add(key, number)`: Mevcut sayısal değere bir sayı ekler veya yoksa/sayısal değilse ayarlar.
*   `subtract(key, number)`: Mevcut sayısal değerden bir sayı çıkarır.
*   `push(key, value)`: Bir diziye değer ekler.
*   `unpush(key, value)`: Bir diziden belirli bir değeri kaldırır.
*   `delByPriority(key, index)`: Dizi elemanını indeksine göre siler (1 tabanlı).
*   `setByPriority(key, value, index)`: Dizi elemanını indeksine göre ayarlar/günceller (1 tabanlı).
*   `all()`: Veritabanındaki tüm verileri alır.
*   `deleteAll()`: Veritabanındaki tüm verileri siler.
*   `importDataFrom(sourceDB)`: Başka bir uyumlu veritabanı kaynağından veri içe aktarır.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen [GitHub](https://github.com/kynuxdev/kynuxdb) üzerinden issue açmaktan veya pull request göndermekten çekinmeyin.

## 💬 Destek

Sorularınız veya yardıma ihtiyacınız olursa [Discord sunucusuna](https://discord.gg/wCK5dVSY2n) katılabilirsiniz.

## 📜 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.
