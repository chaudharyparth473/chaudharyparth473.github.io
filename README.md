# Parth Chaudhary — portfolio

Plain HTML, CSS and vanilla JavaScript. No build step, no dependencies.

## Run it

Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000     # then visit http://localhost:8000

## Structure

    portfolio/
    ├── index.html
    ├── css/styles.css
    ├── js/main.js
    ├── assets/Parth_Chaudhary_Resume.docx
    └── README.md

## Deploy

Push the folder to a GitHub repo and enable GitHub Pages (Settings → Pages → deploy from `main`, root).

## Editing tips

- Colours and fonts live at the top of `css/styles.css` under `:root`.
- Fonts load from Google Fonts; the site falls back to system fonts offline.
- Add a project by copying a `<article class="card reveal" data-tilt>` block in `index.html`.
