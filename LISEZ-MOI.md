# ITN QR — application universelle

Un formulaire, un bouton, un QR code autonome (texte lisible, sans lien vers un serveur).
Exports PNG, SVG et PDF. Historique local. Fonctionne hors connexion après le premier chargement.

## Lancer (PowerShell)

    cd chemin\vers\itn-qr
    npm install
    npm run dev

Ouvrir http://localhost:5173  —  téléphone (même Wi-Fi) : `npm run dev -- --host`

## Installer sur l'écran du téléphone
Le bouton « Installer l'application sur mon téléphone » est sur l'accueil et dans le menu.
- Android (Chrome) : le bouton ouvre la fenêtre d'installation.
- iPhone (Safari) : le bouton affiche les étapes (Partager > Sur l'écran d'accueil).
- L'installation sur téléphone exige une adresse https : déploie l'app (ex. Vercel) puis ouvre cette adresse sur le téléphone. En http://192.168.x.x, le bouton ne pourra pas installer.

## Tester hors connexion

    npm run build
    npm run preview

Ouvrir l'adresse affichée, installer l'application, puis couper Internet et la rouvrir.
(L'installation sur téléphone exige HTTPS, par exemple après déploiement sur Vercel.)

## Logo ITN
Copie ton logo ici : `public/logo-itn.png` (carré, fond transparent ou blanc).
Pour l'icône de l'application installée, remplace aussi `public/pwa-192.png` et `public/pwa-512.png`.

## Tests à faire avec de vrais appareils
1. Générer un QR avec tous les champs, le scanner avec un Android et un iPhone (appareil photo).
2. Mode avion : scanner à nouveau, les informations doivent s'afficher.
3. Ouvrir le PNG, le SVG et le PDF téléchargés, vérifier qu'ils se scannent à l'écran.
4. Imprimer un essai à la taille choisie et le scanner.
