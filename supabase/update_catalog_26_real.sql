-- ============================================================
-- UPDATE catalogo esperienze — dati reali compilati da Luca
-- ============================================================
-- Generato da BeGift_Esperienze_da_compilare.xlsx (2026-05-18)
--
-- Aggiornati 26 record su 28:
--   - title, external_url, image_url, price_min_cents,
--     affiliate_url_template (con partner_id=17&cmp={gift_id})
--
-- Disattivati 2 record (no dati GYG disponibili):
--   - smartbox-spa-couples  (è Smartbox, non GYG)
--   - gyg-bolzano-xmas      (mercatini stagionali, non trovato)
--
-- TODO Luca: rigenerare le description per le esperienze dove
-- ha cambiato l'esperienza (titolo molto diverso dal seed).
-- Esegui su Supabase Dashboard → SQL Editor.
-- ============================================================

BEGIN;

-- gyg-rome-colosseum → Roma: Colosseo e Foro con app audioguida - Arena opzionale
UPDATE public.experiences SET
  title = 'Roma: Colosseo e Foro con app audioguida - Arena opzionale',
  external_url = 'https://www.getyourguide.com/it-it/roma-l33/roma-colosseo-e-foro-con-app-audioguida-arena-opzionale-t562279/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/376912ad96a4e631a7855a9d0ecc49f47d024090336606266afd00aa30c3b0df.jpeg',
  price_min_cents = 3900,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/roma-l33/roma-colosseo-e-foro-con-app-audioguida-arena-opzionale-t562279/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-rome-colosseum';

-- gyg-rome-pasta-class → Roma: lezione di preparazione della pasta a Trastevere con tour gastronomico
UPDATE public.experiences SET
  title = 'Roma: lezione di preparazione della pasta a Trastevere con tour gastronomico',
  external_url = 'https://www.getyourguide.com/it-it/roma-l33/roma-tour-gastronomico-dello-street-food-a-trastevere-t261067/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/638f4522d732b.jpeg',
  price_min_cents = 8300,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/roma-l33/roma-tour-gastronomico-dello-street-food-a-trastevere-t261067/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-rome-pasta-class';

-- gyg-milan-cenacolo → Milano: Tour guidato de "L'Ultima Cena" di Leonardo da Vinci
UPDATE public.experiences SET
  title = 'Milano: Tour guidato de "L''Ultima Cena" di Leonardo da Vinci',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-milano-l139/milano-tour-guidato-de-l-ultima-cena-di-leonardo-da-vinci-t410935/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/3ccb975997e11ac9.jpeg',
  price_min_cents = 8900,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-milano-l139/milano-tour-guidato-de-l-ultima-cena-di-leonardo-da-vinci-t410935/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-milan-cenacolo';

-- gyg-milan-aperitivo-cruise → Milano: tour in barca dei Navigli con aperitivo
UPDATE public.experiences SET
  title = 'Milano: tour in barca dei Navigli con aperitivo',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-milano-l139/milano-giro-in-barca-sul-canale-dei-navigli-con-aperitivo-t425460/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/44595a091f1ebb6a.jpeg',
  price_min_cents = 3500,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-milano-l139/milano-giro-in-barca-sul-canale-dei-navigli-con-aperitivo-t425460/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-milan-aperitivo-cruise';

-- gyg-florence-uffizi → Firenze: biglietto d'ingresso a orario programmato per la Galleria degli Uffizi 
UPDATE public.experiences SET
  title = 'Firenze: biglietto d''ingresso a orario programmato per la Galleria degli Uffizi e audioguida',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-firenze-l32/firenze-biglietto-di-ingresso-prioritario-per-gli-uffizi-e-audioguida-digitale-t638304/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/a421e4d5ee87a6cb68f0a702348b7948ff3cf5e7e66bb9014dae82c25c5aea90.jpeg',
  price_min_cents = 2500,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-firenze-l32/firenze-biglietto-di-ingresso-prioritario-per-gli-uffizi-e-audioguida-digitale-t638304/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-florence-uffizi';

-- gyg-florence-chianti-wine → Tour delle cantine del Chianti con degustazione di vini
UPDATE public.experiences SET
  title = 'Tour delle cantine del Chianti con degustazione di vini',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-firenze-l32/firenze-tour-delle-cantine-del-chianti-con-degustazione-di-vini-t400983/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/c0b675d7a2b2be97132bdecc0cfa31c6399c53ff71a9d2e8d71091926234fb8f.jpg',
  price_min_cents = 5000,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-firenze-l32/firenze-tour-delle-cantine-del-chianti-con-degustazione-di-vini-t400983/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-florence-chianti-wine';

-- gyg-venice-gondola → Venezia: San Marco, Palazzo Ducale, Rialto e giro in gondola
UPDATE public.experiences SET
  title = 'Venezia: San Marco, Palazzo Ducale, Rialto e giro in gondola',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-venezia-l35/venezia-san-marco-palazzo-ducale-rialto-e-giro-in-gondola-t356200/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/5672050202ff7262dc686ad05fff0732df88cfe2a97afaa4120d7bde330528c8.jpg',
  price_min_cents = 3900,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-venezia-l35/venezia-san-marco-palazzo-ducale-rialto-e-giro-in-gondola-t356200/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-venice-gondola';

-- gyg-venice-burano-murano → Murano, Burano e Torcello: tour in barca di mezza giornata a Venezia
UPDATE public.experiences SET
  title = 'Murano, Burano e Torcello: tour in barca di mezza giornata a Venezia',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-venezia-l35/escursione-in-barca-alle-isole-di-murano-burano-e-torcello-t6853/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/c9881ceeeac38eb1ab81bd7be8a3f4d6c85cdf01ca6a16906a3099a6ed8bfe8a.png',
  price_min_cents = 2000,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-venezia-l35/escursione-in-barca-alle-isole-di-murano-burano-e-torcello-t6853/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-venice-burano-murano';

-- gyg-naples-pompeii → Pompei: Biglietto d'ingresso e tour guidato con un archeologo
UPDATE public.experiences SET
  title = 'Pompei: Biglietto d''ingresso e tour guidato con un archeologo',
  external_url = 'https://www.getyourguide.com/it-it/pompei-campania-l156880/pompei-biglietto-d-ingresso-e-tour-guidato-con-un-archeologo-t161715/',
  price_min_cents = 4900,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/pompei-campania-l156880/pompei-biglietto-d-ingresso-e-tour-guidato-con-un-archeologo-t161715/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-naples-pompeii';

-- gyg-naples-pizza-class → Napoli: preparazione della pizza con bevanda e antipasto inclusi
UPDATE public.experiences SET
  title = 'Napoli: preparazione della pizza con bevanda e antipasto inclusi',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-napoli-l162/napoli-laboratorio-di-preparazione-della-pizza-con-bevande-e-aperitivi-t436379/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/bf250f545b4aea1b0b4c4dd9fe0476a397906b2788d06a01c19649bfa6f65e8c.jpg',
  price_min_cents = 3900,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-napoli-l162/napoli-laboratorio-di-preparazione-della-pizza-con-bevande-e-aperitivi-t436379/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-naples-pizza-class';

-- DISATTIVATO: smartbox-spa-couples (Smartbox 'Spa per due': percorso benessere) — dati GYG mancanti
UPDATE public.experiences SET active = false
 WHERE external_id = 'smartbox-spa-couples';

-- gyg-cinque-terre-boat → La Spezia: Tour delle Cinque Terre in barca
UPDATE public.experiences SET
  title = 'La Spezia: Tour delle Cinque Terre in barca',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-la-spezia-l1348/cinque-terre-crociera-in-barca-a-riomaggiore-e-monterosso-t395451/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/ea6cf11df5dfbff8.jpeg',
  price_min_cents = 6900,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-la-spezia-l1348/cinque-terre-crociera-in-barca-a-riomaggiore-e-monterosso-t395451/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-cinque-terre-boat';

-- gyg-dolomites-trek → Misurina/Dolomiti: Giro delle Tre Cime di Lavaredo
UPDATE public.experiences SET
  title = 'Misurina/Dolomiti: Giro delle Tre Cime di Lavaredo',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-auronzo-di-cadore-l213997/misurinadolomiti-giro-delle-tre-cime-di-lavaredo-t1275876/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/f96f92f9717a1229dd87ae90a704f5e49ac046fb5d402175bee2ec538686cfd4.jpg',
  price_min_cents = 8000,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-auronzo-di-cadore-l213997/misurinadolomiti-giro-delle-tre-cime-di-lavaredo-t1275876/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-dolomites-trek';

-- gyg-paris-louvre → Parigi: tour del Louvre, Monna Lisa e capolavori iconici
UPDATE public.experiences SET
  title = 'Parigi: tour del Louvre, Monna Lisa e capolavori iconici',
  external_url = 'https://www.getyourguide.com/it-it/parigi-l16/parigi-tour-del-louvre-monna-lisa-e-capolavori-iconici-t457745/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/b650803cde94191c0cae5aa726459654af25592166fd411d74b734ca769f6ab9.jpg',
  price_min_cents = 6900,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/parigi-l16/parigi-tour-del-louvre-monna-lisa-e-capolavori-iconici-t457745/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-paris-louvre';

-- gyg-london-eye-cruise → Londra: London Eye, crociera sul fiume e tour in autobus Hop-on Hop-off
UPDATE public.experiences SET
  title = 'Londra: London Eye, crociera sul fiume e tour in autobus Hop-on Hop-off',
  external_url = 'https://www.getyourguide.com/it-it/londra-l57/london-eye-e-big-bus-hop-on-hop-off-con-crociera-hop-on-hop-off-sul-fiume-t292175/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/5cb9da61c67b5bb9935757f5f4ff34ef26d8c50cbd0bbad54b3de60a14e60b83.jpg',
  price_min_cents = 6300,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/londra-l57/london-eye-e-big-bus-hop-on-hop-off-con-crociera-hop-on-hop-off-sul-fiume-t292175/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-london-eye-cruise';

-- gyg-lucca-walls-bike → Lucca: partecipa a un tour in bici della città
UPDATE public.experiences SET
  title = 'Lucca: partecipa a un tour in bici della città',
  external_url = 'https://www.getyourguide.com/it-it/lucca-l1517/lucca-tour-in-bicicletta-e-aperitivo-t661769/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/a6013f576ebc92d444a77b6241657e997e5c819b5b1736501bebb27c71c5d2b7.jpeg',
  price_min_cents = 3500,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/lucca-l1517/lucca-tour-in-bicicletta-e-aperitivo-t661769/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-lucca-walls-bike';

-- gyg-lucca-oil-villa → Lucca: tour della Villa Reale con degustazione di vino e olio d'oliva
UPDATE public.experiences SET
  title = 'Lucca: tour della Villa Reale con degustazione di vino e olio d''oliva',
  external_url = 'https://www.getyourguide.com/it-it/capannori-l157061/lucca-tour-della-villa-reale-con-degustazione-di-vino-e-olio-d-oliva-t1229048/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/8901aaff81eb3a6919ce5d07eec530b83d6d242e9aaf74f905faf1b59eb7fca3.jpeg',
  price_min_cents = 7900,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/capannori-l157061/lucca-tour-della-villa-reale-con-degustazione-di-vino-e-olio-d-oliva-t1229048/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-lucca-oil-villa';

-- gyg-lucca-walk → Lucca: tour a piedi di 2 ore del centro città
UPDATE public.experiences SET
  title = 'Lucca: tour a piedi di 2 ore del centro città',
  external_url = 'https://www.getyourguide.com/it-it/lucca-l1517/lucca-tour-a-piedi-di-2-ore-del-centro-citta-t269687/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/5d1b799fa0c38.jpeg',
  price_min_cents = 1500,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/lucca-l1517/lucca-tour-a-piedi-di-2-ore-del-centro-citta-t269687/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-lucca-walk';

-- gyg-rome-vatican → Vaticano: Biglietto d'ingresso per i musei e la Cappella Sistina
UPDATE public.experiences SET
  title = 'Vaticano: Biglietto d''ingresso per i musei e la Cappella Sistina',
  external_url = 'https://www.getyourguide.com/it-it/roma-l33/biglietto-di-ingresso-prioritario-per-i-musei-vaticani-e-la-cappella-sistina-t62214/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/5f16d60b18470.jpeg',
  price_min_cents = 3300,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/roma-l33/biglietto-di-ingresso-prioritario-per-i-musei-vaticani-e-la-cappella-sistina-t62214/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-rome-vatican';

-- gyg-amalfi-boat → Da Sorrento/Nerano: Tour in barca di Amalfi e Positano
UPDATE public.experiences SET
  title = 'Da Sorrento/Nerano: Tour in barca di Amalfi e Positano',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-sorrento-l391/da-sorrentonerano-tour-in-barca-di-amalfi-e-positano-t284922/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/4713c745643bb297947caa959237eb97bef8aa6206073e28a04a6f795e7685c0.jpg',
  price_min_cents = 6000,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-sorrento-l391/da-sorrentonerano-tour-in-barca-di-amalfi-e-positano-t284922/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-amalfi-boat';

-- gyg-capri-bluegrotto → Da Napoli: Escursione di un'intera giornata a Capri, Anacapri e Grotta Azzurra
UPDATE public.experiences SET
  title = 'Da Napoli: Escursione di un''intera giornata a Capri, Anacapri e Grotta Azzurra',
  external_url = 'https://www.getyourguide.com/it-it/isola-di-capri-l693/tour-di-un-giorno-a-capri-anacapri-e-alla-grotta-azzurra-piccoli-gruppi-t513123/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/07415340dbbce3c44e7c059d62df93e2a7c58ed802d8a91938b226f56e104bbb.jpg',
  price_min_cents = 16200,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/isola-di-capri-l693/tour-di-un-giorno-a-capri-anacapri-e-alla-grotta-azzurra-piccoli-gruppi-t513123/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-capri-bluegrotto';

-- gyg-dolomites-funes → Da Venezia: Tour di un giorno nelle Dolomiti e al Lago di Braies
UPDATE public.experiences SET
  title = 'Da Venezia: Tour di un giorno nelle Dolomiti e al Lago di Braies',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-venezia-l35/da-venezia-tour-delle-dolomiti-e-braies-t1240813/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/8b4e6ca681ea930bc95c5d985880fa1016e0ffe929efd27e7fd623a1659fdf5b.jpg',
  price_min_cents = 10000,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-venezia-l35/da-venezia-tour-delle-dolomiti-e-braies-t1240813/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-dolomites-funes';

-- gyg-bologna-food → Bologna: tour gastronomico dello street food nel centro storico
UPDATE public.experiences SET
  title = 'Bologna: tour gastronomico dello street food nel centro storico',
  external_url = 'https://www.getyourguide.com/it-it/bologna-l1431/bologna-tour-gastronomico-dello-street-food-nel-centro-storico-t1016024/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/40a7e33eb7588191673c56cb88725167e3ede7bdc3569cc7c620b4f81fcdd3df.jpg',
  price_min_cents = 5300,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/bologna-l1431/bologna-tour-gastronomico-dello-street-food-nel-centro-storico-t1016024/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-bologna-food';

-- gyg-etna-trek → Etna: trekking guidato fino ai crateri sommitali
UPDATE public.experiences SET
  title = 'Etna: trekking guidato fino ai crateri sommitali',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-catania-l258/etna-tour-guidato-di-trekking-sul-vulcano-a-3000-metri-con-funivia-t279292/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/7eefe5c2423a266c4f96af296df33c44cb138057be55164fb013ae55b94d394c.jpg',
  price_min_cents = 5500,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-catania-l258/etna-tour-guidato-di-trekking-sul-vulcano-a-3000-metri-con-funivia-t279292/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-etna-trek';

-- gyg-palermo-food → Palermo: tour a piedi dello street food con degustazione
UPDATE public.experiences SET
  title = 'Palermo: tour a piedi dello street food con degustazione',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-palermo-l387/tour-gastronomico-dei-2-mercati-di-palermo-t542524/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/609a785f13bc7c2fe4238ae63995ee9b7ce8bb0a6b15bc271a5e46e81f1cb3c1.jpg',
  price_min_cents = 4400,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-palermo-l387/tour-gastronomico-dei-2-mercati-di-palermo-t542524/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-palermo-food';

-- gyg-verona-arena → Arena di Verona e tour guidato della città con biglietto salta-la-fila
UPDATE public.experiences SET
  title = 'Arena di Verona e tour guidato della città con biglietto salta-la-fila',
  external_url = 'https://www.getyourguide.com/it-it/comune-di-verona-l389/verona-tour-a-piedi-con-biglietto-d-ingresso-prioritario-all-arena-t179078/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/f78fe3e29e0b393bd78ac3dbb3b533674b4657fb6208e6de51d4e5636b948261.jpg',
  price_min_cents = 6900,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/comune-di-verona-l389/verona-tour-a-piedi-con-biglietto-d-ingresso-prioritario-all-arena-t179078/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-verona-arena';

-- DISATTIVATO: gyg-bolzano-xmas (Mercatini di Natale di Bolzano e Merano: tour in giornata) — dati GYG mancanti
UPDATE public.experiences SET active = false
 WHERE external_id = 'gyg-bolzano-xmas';

-- gyg-saturnia-spa → Saturnia: Biglietto giornaliero per le piscine termali delle Terme di Saturnia
UPDATE public.experiences SET
  title = 'Saturnia: Biglietto giornaliero per le piscine termali delle Terme di Saturnia',
  external_url = 'https://www.getyourguide.com/it-it/saturnia-l188980/saturnia-biglietto-giornaliero-per-le-piscine-termali-delle-terme-di-saturnia-t872325/',
  image_url = 'https://cdn.getyourguide.com/image/format=auto,fit=crop,gravity=auto,quality=60,height=565,dpr=2/tour_img/13a420fa3674d0f85f84bf7095bb081c3950367acd6bfdb702c5edb43b31c6d6.jpg',
  price_min_cents = 3000,
  price_max_cents = NULL,
  affiliate_url_template = 'https://www.getyourguide.com/it-it/saturnia-l188980/saturnia-biglietto-giornaliero-per-le-piscine-termali-delle-terme-di-saturnia-t872325/?partner_id=17&cmp={gift_id}',
  active = true
 WHERE external_id = 'gyg-saturnia-spa';

-- ── Verifica ──
SELECT external_id, title, price_min_cents, active,
       CASE WHEN affiliate_url_template LIKE '%partner_id=17%' THEN 'OK' ELSE 'MISSING_PID' END AS pid_check,
       CASE WHEN image_url LIKE 'https://cdn.getyourguide.com/%' THEN 'OK' ELSE 'CHECK' END AS img_check
  FROM public.experiences
 ORDER BY active DESC, city, external_id;

COMMIT;