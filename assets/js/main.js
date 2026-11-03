/* Allard Sport Équipement · scripts du site (sans bibliothèque) */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* En-tête : plein dès qu'on défile sur l'accueil */
  var head = document.querySelector('.site-head');
  if (head && document.body.classList.contains('accueil')) {
    var maj = function () { head.classList.toggle('plein', window.scrollY > 40); };
    maj();
    window.addEventListener('scroll', maj, { passive: true });
  }

  /* Menu mobile */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('menu');
  if (burger && nav) {
    var fermer = function () {
      burger.setAttribute('aria-expanded', 'false');
      burger.querySelector('.sr').textContent = 'Ouvrir le menu';
      nav.classList.remove('ouvert');
      document.body.classList.remove('menu-ouvert');
    };
    burger.addEventListener('click', function () {
      var ouvert = burger.getAttribute('aria-expanded') === 'true';
      if (ouvert) { fermer(); return; }
      burger.setAttribute('aria-expanded', 'true');
      burger.querySelector('.sr').textContent = 'Fermer le menu';
      nav.classList.add('ouvert');
      document.body.classList.add('menu-ouvert');
      var premier = nav.querySelector('a');
      if (premier) premier.focus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('ouvert')) { fermer(); burger.focus(); }
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) fermer(); });
  }

  /* Vidéos : lecture automatique muette, jamais si l'utilisateur préfère moins d'animations
     ou économise ses données ; bouton pause pour la vidéo d'accueil */
  var eco = navigator.connection && navigator.connection.saveData;
  document.querySelectorAll('video[data-auto]').forEach(function (v) {
    if (reduit || eco) { v.removeAttribute('autoplay'); v.pause(); return; }
    v.muted = true;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  });
  var btn = document.querySelector('.pause-video');
  var hv = document.querySelector('.hero video');
  if (btn && hv) {
    var etiquette = function () {
      var enPause = hv.paused;
      btn.setAttribute('aria-pressed', enPause ? 'true' : 'false');
      btn.querySelector('span').textContent = enPause ? 'Lire la vidéo' : 'Mettre la vidéo en pause';
      btn.querySelector('.i-pause').style.display = enPause ? 'none' : '';
      btn.querySelector('.i-lire').style.display = enPause ? '' : 'none';
    };
    btn.addEventListener('click', function () { if (hv.paused) { hv.play(); } else { hv.pause(); } });
    hv.addEventListener('play', etiquette);
    hv.addEventListener('pause', etiquette);
    etiquette();
  }

  /* Tracé des lignes du héros : une seule animation, au chargement */
  if (!reduit && document.querySelector('.hero__lignes')) {
    requestAnimationFrame(function () { doc.classList.add('anime'); });
  }

  /* Formulaire de devis (maquette : rien n'est envoyé) */
  var form = document.getElementById('form-devis');
  if (form) {
    var params = new URLSearchParams(location.search);
    var fam = params.get('famille');
    if (fam) {
      var sel = form.querySelector('#famille');
      if (sel && sel.querySelector('option[value="' + fam + '"]')) sel.value = fam;
    }
    if (params.get('adeps') === '1') {
      var cb = form.querySelector('#adeps');
      if (cb) cb.checked = true;
    }
    if (params.get('objet') === 'catalogue') {
      var obj = form.querySelector('#projet');
      if (obj && !obj.value) obj.value = 'Je souhaite recevoir le catalogue papier à l’adresse suivante : ';
    }

    var regles = {
      nom: function (v) { return v.trim().length >= 2 ? '' : 'Indiquez votre nom.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Indiquez une adresse e-mail valide, par exemple nom@commune.be.'; },
      projet: function (v) { return v.trim().length >= 10 ? '' : 'Décrivez votre besoin en quelques mots (au moins 10 caractères).'; },
      rgpd: function (v, el) { return el.checked ? '' : 'Cochez la case pour que nous puissions vous répondre.'; }
    };
    var verifier = function (el) {
      var r = regles[el.name];
      if (!r) return true;
      var msg = r(el.value, el);
      var zone = document.getElementById('err-' + el.name);
      if (zone) zone.textContent = msg;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    };
    form.querySelectorAll('[name]').forEach(function (el) {
      if (regles[el.name]) el.addEventListener('blur', function () { if (el.value || el.type === 'checkbox') verifier(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var premierFaux = null;
      Object.keys(regles).forEach(function (n) {
        var el = form.elements[n];
        if (el && !verifier(el) && !premierFaux) premierFaux = el;
      });
      if (premierFaux) { premierFaux.focus(); return; }
      var d = new FormData(form);
      var lignes = [];
      var libelles = { profil: 'Vous êtes', nom: 'Nom', organisation: 'Organisation', email: 'E-mail', tel: 'Téléphone', cp: 'Code postal', pays: 'Pays', famille: 'Famille de produits', delai: 'Échéance', projet: 'Projet' };
      Object.keys(libelles).forEach(function (k) {
        var v = d.get(k);
        if (k === 'famille' && v) { var o = form.querySelector('#famille option[value="' + v + '"]'); v = o ? o.textContent : v; }
        if (v) lignes.push(libelles[k] + ' : ' + v);
      });
      if (d.get('adeps')) lignes.push('Devis pour un dossier de subside Adeps : oui');
      var retour = document.getElementById('form-retour');
      retour.querySelector('pre').textContent = lignes.join('\n');
      retour.hidden = false;
      form.hidden = true;
      retour.focus();
    });
    var re = document.getElementById('form-recommencer');
    if (re) re.addEventListener('click', function () {
      document.getElementById('form-retour').hidden = true;
      form.hidden = false;
      form.querySelector('input, select, textarea').focus();
    });
  }
})();

/* Réalisations : filtres par type de travaux et par pays */
(function () {
  var liste = document.getElementById('reals');
  if (!liste) return;
  var etat = { cat: 'tout', pays: 'tout' };
  var compte = document.getElementById('compte-reals');
  var appliquer = function () {
    var n = 0;
    liste.querySelectorAll('.real').forEach(function (li) {
      var ok = (etat.cat === 'tout' || li.dataset.cat === etat.cat) && (etat.pays === 'tout' || li.dataset.pays === etat.pays);
      li.hidden = !ok;
      if (ok) n++;
    });
    if (compte) compte.textContent = n + (n > 1 ? ' références affichées.' : ' référence affichée.');
  };
  document.querySelectorAll('.filtre').forEach(function (b) {
    b.addEventListener('click', function () {
      var cle = b.dataset.cat !== undefined ? 'cat' : 'pays';
      etat[cle] = b.dataset[cle];
      b.parentNode.querySelectorAll('.filtre').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      appliquer();
    });
  });
})();
