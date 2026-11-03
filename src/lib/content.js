const clean = (v) => (v ?? '').toString().trim()

// Numéros : "77 123 45 67" devient +221771234567 ; sinon saisir l'indicatif (+33..., 00...).
export function intl(n) {
  let s = clean(n)
  if (s.startsWith('00')) s = '+' + s.slice(2)
  const d = s.replace(/\D/g, '')
  if (s.startsWith('+')) return d.length >= 8 ? '+' + d : ''
  if (/^7[05678]\d{7}$/.test(d)) return '+221' + d
  return ''
}
const phoneOf = (n) => intl(n) || clean(n).replace(/[^\d+]/g, '')
export const waLink = (n) => { const i = intl(n); return i ? 'https://wa.me/' + i.slice(1) : '' }

// Facebook / Instagram : accepte un lien complet ou juste un nom d'utilisateur.
function social(v, base) {
  v = clean(v)
  if (!v) return ''
  if (/^https?:\/\//i.test(v)) return v
  if (/^(www\.|[\w-]+\.)?(facebook|fb|instagram)\.com/i.test(v) || v.includes('/')) return 'https://' + v
  return base + v.replace(/^@/, '')
}

export const FIELDS = [
  { k: 'fullName', l: 'Nom et prénom' },
  { k: 'company', l: "Nom de l'entreprise" },
  { k: 'activity', l: 'Activité ou profession' },
  { k: 'phone', l: 'Numéro de téléphone', type: 'tel' },
  { k: 'whatsapp', l: 'Numéro WhatsApp', type: 'tel' },
  { k: 'email', l: 'Adresse e-mail', type: 'email' },
  { k: 'address', l: 'Adresse' },
  { k: 'facebook', l: 'Facebook (lien ou nom)' },
  { k: 'instagram', l: 'Instagram (lien ou nom)' },
  { k: 'other', l: 'Autres informations', area: true },
]

// Retourne { data, error }. Tout est encodé dans le QR en texte : aucun serveur nécessaire.
export function buildContent(f) {
  const g = (k) => clean(f[k])
  if (!FIELDS.some((x) => g(x.k))) return { data: '', error: 'Remplis au moins un champ.' }
  if (g('email') && !/^\S+@\S+\.\S+$/.test(g('email'))) return { data: '', error: "L'adresse e-mail n'est pas valide." }
  if (g('whatsapp') && !waLink(g('whatsapp'))) return { data: '', error: "Numéro WhatsApp invalide : ajoute l'indicatif pays (ex. +221 77 123 45 67)." }

  const fb = social(f.facebook, 'https://facebook.com/')
  const ig = social(f.instagram, 'https://instagram.com/')
  const tel = phoneOf(g('phone')), wa = intl(g('whatsapp'))

  // Texte lisible : s'affiche directement après le scan, sans application ni connexion.
  const L = [
    g('fullName') && 'Nom : ' + g('fullName'),
    g('company') && 'Entreprise : ' + g('company'),
    g('activity') && 'Activité : ' + g('activity'),
    tel && 'Téléphone : ' + tel,
    wa && `WhatsApp : ${wa} (${waLink(wa)})`,
    g('email') && 'E-mail : ' + g('email'),
    g('address') && 'Adresse : ' + g('address'),
    fb && 'Facebook : ' + fb,
    ig && 'Instagram : ' + ig,
    g('other') && 'Infos : ' + g('other'),
  ].filter(Boolean)
  return { data: L.join('\n'), error: '' }
}

export const labelOf = (f) => clean(f.fullName) || clean(f.company) || clean(f.phone) || 'QR code'
