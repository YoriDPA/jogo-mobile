const CACHE_NAME = 'snake-io-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './src/main.js',
    './src/game.js',
    './src/renderer.js',
    './src/input.js',
    './src/snake.js',
    './src/bot.js',
    './src/food.js',
    './src/utils.js',
    './icon.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
