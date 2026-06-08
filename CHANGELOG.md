# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2](https://github.com/Team-MaRo/d3strukt0r-portfolio/compare/1.1.1...1.1.2) (2026-06-08)


### 🐛 Bug Fixes

* support GitHub Pages project sub-path deploys ([67293ba](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/67293bafb310e94c5e5c1413cf5fccd8e8b5a899))
* Update to new repo location & use new central Vagrantbox ([24304e0](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/24304e0f004b8f635b87bac57a0d8de2f853ff17))


### 📚 Documentation

* Add note about keep a changelog ([2460cbc](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/2460cbc4a4a7cb4a0d4246fbf0c4af2841e160fa))

## [1.1.1](https://github.com/Team-MaRo/d3strukt0r-portfolio/compare/1.1.0...1.1.1) (2026-06-04)


### 🐛 Bug Fixes

* compute experience durations from a request-time now to stop SSR hydration mismatch ([38fe7fa](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/38fe7fadc898dfe6274107b0c6fca354f62bc492))
* detect language per-request to stop SSR hydration mismatch ([5eacaf9](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/5eacaf9268e6477abb6a8a485999c8f1aa4eae2e))
* keep unprefixed backdrop-filter in the production build ([7939abc](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/7939abcb633d94d0edbcc46b9a138693ac24a1e7))

## [1.1.0](https://github.com/Team-MaRo/d3strukt0r-portfolio/compare/1.0.1...1.1.0) (2026-06-03)


### ✨ Features

* add Cloudflare Workers SSR as a third deploy target ([8093708](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/809370806d97c262ea1beedea7c7176464d0b4cb))
* **build:** source SITE_HOST from GitHub Pages REST API ([f10478e](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/f10478e9e73c4ed73bd8c6e69fa64a5456a59f65))
* Dynamic SEO in SSR and build in SPA & favicon endpoints for Dev mode ([819b5b4](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/819b5b4a06fc1f6f051198cc0c098692a39fb431))
* **i18n:** hot-reload locale edits in dev ([9c300a4](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/9c300a4f582d1bb4a92273c323c59d9c0841a5a5))
* Rebuild new UI with schadcn & gsap ([dc01933](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/dc01933c42eb969645930cffaf968b24c0510141))
* Simplify frontend ([9a11ab6](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/9a11ab683e72b6f6c21205728bfd2b066adb4b76))
* Use standard tokens and rem instead of px ([c6c09b4](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/c6c09b4f99895b7511ea4c60d8650d31f80c7165))


### 🐛 Bug Fixes

* Mobile overflow & CI broken & update deps ([32bc8ad](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/32bc8ade61dda24d8f60b0908fd06f7b20686773))
* Nav over notification bar and width overflow ([6525934](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/6525934cd69c3430c132813c349b3b6ecd05cfd5))


### ♻️ Refactoring

* **plugins:** split static-artifacts into spa-fallback + atom-feed ([1421ef7](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/1421ef7200e29d73005df680b53b1edc6787cfac))
* **theme:** share state via useSyncExternalStore, sync meta theme-color ([5e32951](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/5e32951f01cccc4648365774be641d31a4c7b064))

## [1.0.1](https://github.com/Team-MaRo/d3strukt0r-portfolio/compare/1.0.0...1.0.1) (2026-05-15)


### 🐛 Bug Fixes

* Enhance LinkedIn data sync workflow and `develop` branch management ([0ce0a2b](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/0ce0a2be07b6054b4890f4d1b6089040aff74548))

## [1.0.0](https://github.com/Team-MaRo/d3strukt0r-portfolio/compare/0.1.0...1.0.0) (2026-05-15)


### ✨ Features

* Initial commit ([04dcba9](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/04dcba9fb460b63473c79abb4729f4b9d2d86e04))
* Switch to Nix based container build ([97793f0](https://github.com/Team-MaRo/d3strukt0r-portfolio/commit/97793f074c8a444e74f4b46f7413908a4f09c597))
