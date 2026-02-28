import { NextRequest, NextResponse } from 'next/server';

type ChatRequestBody = {
  message?: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildAnswer(rawMessage: string) {
  const message = normalize(rawMessage);

  if (message.includes('bonjour') || message.includes('salut')) {
    return 'Bonjour 👋 Je suis votre assistant tourisme Côte d’Ivoire. Posez-moi vos questions sur les destinations, le budget, le transport ou la sécurité.';
  }

  if (
    message.includes('ou aller') ||
    message.includes('destination') ||
    message.includes('visiter') ||
    message.includes('sejour')
  ) {
    return 'Pour un premier séjour en Côte d’Ivoire: Grand-Bassam (histoire), Assinie (plage), Yamoussoukro (patrimoine), Man (montagnes) et parc national de la Comoé (nature).';
  }

  if (
    message.includes('budget') ||
    message.includes('prix') ||
    message.includes('cout') ||
    message.includes('combien')
  ) {
    return 'Budget indicatif/jour: économique 25 000–45 000 FCFA, confort 50 000–100 000 FCFA, premium 120 000+ FCFA (hébergement, repas, transport local et activités).';
  }

  if (
    message.includes('transport') ||
    message.includes('deplacement') ||
    message.includes('taxi') ||
    message.includes('bus')
  ) {
    return 'À Abidjan: VTC/taxi pour la flexibilité. Inter-villes: bus et minibus fiables sur les grands axes. Pour optimiser votre temps, combinez transfert privé + excursions guidées.';
  }

  if (
    message.includes('securite') ||
    message.includes('dangereux') ||
    message.includes('risque')
  ) {
    return 'Conseils sécurité: privilégiez les opérateurs certifiés, évitez les déplacements tardifs dans les zones inconnues, gardez copies de vos documents et utilisez des moyens de transport reconnus.';
  }

  if (
    message.includes('manger') ||
    message.includes('gastronomie') ||
    message.includes('plat') ||
    message.includes('restaurant')
  ) {
    return 'À tester absolument: attiéké-poisson, alloco, garba, kedjenou, foutou-sauce graine. Idéalement, combinez adresses locales connues et restaurants recommandés.';
  }

  if (
    message.includes('quand partir') ||
    message.includes('saison') ||
    message.includes('meteo')
  ) {
    return 'La Côte d’Ivoire se visite toute l’année, avec une préférence pour les périodes moins pluvieuses selon les régions. Pour la côte, vérifiez la météo locale avant votre départ.';
  }

  if (
    message.includes('visa') ||
    message.includes('formalites') ||
    message.includes('document')
  ) {
    return 'Pour les formalités (visa, passeport, vaccins), vérifiez toujours les sources officielles les plus récentes du pays de départ et des autorités ivoiriennes.';
  }

  return 'Je peux vous aider sur: destinations, budget, transport, sécurité, gastronomie, saisons et formalités en Côte d’Ivoire. Que souhaitez-vous savoir ?';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'message requis' }, { status: 400 });
    }

    const answer = buildAnswer(message);

    return NextResponse.json({
      answer,
      source: 'tourisme Ci Assistant',
    });
  } catch (error) {
    console.error('POST /api/chatbot', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
