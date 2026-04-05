// i18n – 1:1 Port from Website
// Uses device locale for automatic language detection

const LOCALES = {
  de: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.music': 'Music',
    'nav.booking': 'Booking',
    'nav.contact': 'Contact',
    'nav.getInTouch': 'Get in Touch',
    'hero.badge': 'BERLIN UNDERGROUND TECHNO',
    'hero.tagline.1': 'UNDERGROUND',
    'hero.tagline.2': 'SOUND',
    'hero.tagline.3': 'EXPERIENCE',
    'hero.cta.music': 'GET THE SOUND',
    'hero.cta.booking': 'BOOK NOW',
    'hero.scroll': 'SCROLL',
    'bio.sectionLabel': '// ABOUT',
    'bio.title': 'AIRDOX',
    'bio.intro': 'Der Sound AIRDOX steht für puristischen Berliner Underground Techno – einen Sound, der keine Kompromisse kennt. Treibende Rhythmen, die die Tanzfläche zum Kochen bringen.',
    'bio.body1': 'Deine Füße werden nicht stillstehen. Beats, die greifen und nicht mehr loslassen. Keine endlosen Flächen, kein Energieverlust – nur pure, unerbittliche Tanzenergie, die stundenlang trägt.',
    'bio.heading1': 'Die Prägung',
    'bio.body2': 'Seine musikalische DNA wurde in den legendären Nächten des alten Tresor geschrieben – genauer gesagt in der oberen Etage, im Alten Globus. Nicht der raue Keller-Sound, sondern der cleane, energetische Techno der Leipziger Straße 126A formte seine Ästhetik.',
    'bio.body3': 'Seine Helden dieser Ära: Djoker Daan, Duffy, Wimpy, Housemeister und Kristin – DJs, die genau jene Vision von Tanzflächen-Techno verkörperten, die bis heute sein Schaffen bestimmt.',
    'bio.heading2': 'Der Weg',
    'bio.body4': 'Seit über zwei Jahrzehnten ist AIRDOX Teil der Szene, doch lange teilte sich seine Energie zwischen Studium, Beruf und Musik. Der volle Fokus musste warten. Heute gilt seine gesamte Kraft der Musik.',
    'bio.heading3': 'Die Vision',
    'bio.body5': 'AIRDOX ist offen für Kollaborationen und den kreativen Austausch mit Gleichgesinnten. Dieser Dialog bereichert und schärft seinen fest definierten Stil.',
    'bio.showMore': 'MEHR LESEN',
    'bio.showLess': 'WENIGER',
    'music.sectionLabel': '// LATEST RELEASES',
    'music.title': 'MUSIC',
    'music.subtitle': 'Stream exclusive techno sets',
    'music.plays': 'Plays',
    'music.likes': 'Likes',
    'music.dislikes': 'Dislikes',
    'booking.sectionLabel': '// GET IN TOUCH',
    'booking.title': 'BOOKING',
    'booking.subtitle': 'Available for clubs, festivals, and private events.',
    'booking.emailLabel': 'EMAIL',
    'booking.basedLabel': 'BASED IN',
    'booking.basedValue': 'Berlin, Germany',
    'booking.formTitle': 'Nachricht senden',
    'booking.name': 'Dein Name',
    'booking.email': 'E-Mail Adresse',
    'booking.event': 'Event / Venue',
    'booking.message': 'Deine Nachricht',
    'booking.submit': 'Anfrage senden',
    'booking.successTitle': 'Nachricht gesendet!',
    'booking.successBody': 'Danke für deine Anfrage. Ich melde mich bald bei dir.',
    'booking.newMessage': 'Neue Nachricht',
    'footer.tagline': 'BERLIN UNDERGROUND TECHNO',
    'footer.backToTop': 'Back to Top',
    'footer.madeWith': 'Made with',
    'footer.inBerlin': 'in Berlin',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.music': 'Music',
    'nav.booking': 'Booking',
    'nav.contact': 'Contact',
    'nav.getInTouch': 'Get in Touch',
    'hero.badge': 'BERLIN UNDERGROUND TECHNO',
    'hero.tagline.1': 'UNDERGROUND',
    'hero.tagline.2': 'SOUND',
    'hero.tagline.3': 'EXPERIENCE',
    'hero.cta.music': 'GET THE SOUND',
    'hero.cta.booking': 'BOOK NOW',
    'hero.scroll': 'SCROLL',
    'bio.sectionLabel': '// ABOUT',
    'bio.title': 'AIRDOX',
    'bio.intro': 'AIRDOX stands for pure Berlin underground techno — a sound without compromise. Driving rhythms that heat up the dancefloor.',
    'bio.body1': "Your feet won't stand still. Beats that grip and never let go. No endless pads, no loss of energy — just relentless dancefloor power for hours.",
    'bio.heading1': 'The Roots',
    'bio.body2': 'His musical DNA was written during the legendary nights at the old Tresor — specifically on the upper floor, the Alte Globus. Not the rough cellar sound, but the clean, energetic techno of Leipziger Straße 126A shaped his aesthetic.',
    'bio.body3': 'Heroes of that era: Djoker Daan, Duffy, Wimpy, Housemeister and Kristin — DJs who embodied the exact vision of dancefloor techno that still defines his sound.',
    'bio.heading2': 'The Path',
    'bio.body4': 'For over two decades AIRDOX has been part of the scene, but for a long time his energy was split between studies, career and music. Full focus had to wait. Today his entire force is dedicated to music.',
    'bio.heading3': 'The Vision',
    'bio.body5': 'AIRDOX is open to collaborations and creative exchange with like‑minded artists. This dialogue sharpens his already defined style.',
    'bio.showMore': 'READ MORE',
    'bio.showLess': 'SHOW LESS',
    'music.sectionLabel': '// LATEST RELEASES',
    'music.title': 'MUSIC',
    'music.subtitle': 'Stream exclusive underground techno sets',
    'music.plays': 'Plays',
    'music.likes': 'Likes',
    'music.dislikes': 'Dislikes',
    'booking.sectionLabel': '// GET IN TOUCH',
    'booking.title': 'BOOKING',
    'booking.subtitle': 'Available for clubs, festivals and private events.',
    'booking.emailLabel': 'EMAIL',
    'booking.basedLabel': 'BASED IN',
    'booking.basedValue': 'Berlin, Germany',
    'booking.formTitle': 'Send a Message',
    'booking.name': 'Your Name',
    'booking.email': 'Email Address',
    'booking.event': 'Event / Venue',
    'booking.message': 'Your Message',
    'booking.submit': 'Send Request',
    'booking.successTitle': 'Message sent!',
    'booking.successBody': "Thanks for your request. I'll get back to you soon.",
    'booking.newMessage': 'New Message',
    'footer.tagline': 'BERLIN UNDERGROUND TECHNO',
    'footer.backToTop': 'Back to Top',
    'footer.madeWith': 'Made with',
    'footer.inBerlin': 'in Berlin',
  },
};

let currentLocale = 'de';

export const initLocale = () => {
  try {
    // expo-localization may not be available at import time
    const Localization = require('expo-localization');
    const deviceLocale = Localization.getLocales?.()?.[0]?.languageCode || 'de';
    currentLocale = deviceLocale === 'en' ? 'en' : 'de';
  } catch {
    currentLocale = 'de';
  }
};

// Initialize on load
initLocale();

export const setLocale = (locale) => {
  currentLocale = locale === 'en' ? 'en' : 'de';
};

export const t = (key) => LOCALES[currentLocale]?.[key] ?? LOCALES.de[key] ?? key;
export const getCurrentLocale = () => currentLocale;
