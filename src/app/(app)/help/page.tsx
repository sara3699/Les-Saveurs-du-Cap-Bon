import Link from "next/link";
import { SourceBadge } from "@/components/ui/badges";
import { Card, DemoChip, PageHeader } from "@/components/ui/surfaces";
import type { ChannelId } from "@/lib/domain/types";

export const metadata = { title: "Besoin d'aide, Les Saveurs du Cap Bon" };

interface Guide {
  id: string;
  channelId: ChannelId;
  title: string;
  what: string;
  youNeed: string[];
  weDo: string[];
  gotcha?: string;
}

const GUIDES: Guide[] = [
  {
    id: "website-form",
    channelId: "website",
    title: "Formulaire de contact du site web",
    what: "Les demandes envoyées depuis votre propre site arrivent sous forme de conversations, avec la page d'origine.",
    youNeed: [
      "Un site auquel vous pouvez ajouter un formulaire",
      "Dix minutes avec la personne qui gère le site",
    ],
    weDo: [
      "Vous donner une adresse sur votre espace Les Saveurs du Cap Bon vers laquelle le formulaire envoie les demandes",
      "Vérifier chaque demande avant de l'accepter, et refuser tout ce qui est mal formé",
      "Limiter la fréquence d'appel de cette adresse, pour que personne ne puisse inonder votre boîte de réception",
    ],
  },
  {
    id: "whatsapp",
    channelId: "whatsapp",
    title: "WhatsApp Business",
    what: "Lisez et répondez aux messages WhatsApp ici, plutôt que sur un téléphone que l'on se passe entre collègues.",
    youNeed: [
      "Une entreprise vérifiée auprès de Meta",
      "Un numéro de téléphone qui n'est pas déjà utilisé sur l'application WhatsApp",
      "Un modèle de message approuvé par Meta",
    ],
    weDo: [
      "Passer par la plateforme officielle WhatsApp Business, jamais par votre compte personnel",
      "Conserver les messages reçus, vos réponses et les accusés de réception comme des enregistrements distincts",
      "Refuser d'envoyer un modèle que Meta n'a pas approuvé, plutôt que d'échouer en silence",
    ],
    gotcha:
      "Répondre dans les 24 heures qui suivent le message d'un client ne demande rien de plus. Ouvrir une conversation après ce délai exige un modèle approuvé, et l'approbation prend plusieurs jours.",
  },
  {
    id: "instagram",
    channelId: "instagram",
    title: "Instagram",
    what: "Les messages envoyés à votre compte professionnel Instagram arrivent dans la même liste.",
    youNeed: [
      "Un compte professionnel Instagram",
      "Une page Facebook liée à ce compte, que vous administrez",
    ],
    weDo: [
      "Demander à Meta uniquement l'autorisation nécessaire pour lire et répondre aux messages",
      "Garder les réponses aux stories et les commentaires de publication distincts des messages directs",
    ],
    gotcha:
      "Seuls les comptes professionnels peuvent être connectés. Aucun produit ne peut lire une boîte de réception Instagram personnelle, celui-ci compris.",
  },
  {
    id: "facebook",
    channelId: "facebook",
    title: "Facebook Messenger",
    what: "Les messages envoyés à votre page Facebook, auxquels vous répondez depuis ici.",
    youNeed: ["Une page Facebook que vous administrez"],
    weDo: [
      "Connecter la page via la plateforme officielle Messenger",
      "Vous prévenir dès que l'autorisation sur la page est retirée, au lieu de ne plus rien recevoir en silence",
    ],
    gotcha: "Les messages envoyés à un profil Facebook personnel ne sont jamais disponibles. Les pages uniquement.",
  },
  {
    id: "google-ads",
    channelId: "google",
    title: "Formulaires prospects Google Ads",
    what: "Une personne qui remplit un formulaire prospect sur votre annonce devient une demande ici, avec le nom de la campagne.",
    youNeed: ["Un compte Google Ads", "Au moins un formulaire prospect sur une campagne"],
    weDo: [
      "Vérifier la clé sur chaque notification, pour qu'un inconnu ne puisse pas envoyer de faux prospects",
      "Enregistrer la campagne, pour que vous sachiez quelle annonce a été rentable",
    ],
  },
  {
    id: "google-business",
    channelId: "google",
    title: "Google Business Profile",
    what: "Les messages et les avis de votre Google Business Profile. Prévu, pas encore développé.",
    youNeed: ["Un Google Business Profile vérifié"],
    weDo: ["Le garder comme source distincte, pour qu'un avis ne soit jamais compté comme un prospect"],
  },
  {
    id: "gmail",
    channelId: "google",
    title: "Gmail",
    what: "Les e-mails envoyés à l'adresse de la boutique, sous forme de conversations. Prévu, pas encore développé.",
    youNeed: ["Un compte Gmail ou Google Workspace"],
    weDo: ["Le garder séparé de Google Ads, parce que les deux répondent à des questions différentes"],
  },
  {
    id: "manual",
    channelId: "manual",
    title: "Saisi à la main",
    what: "Les commandes et les demandes prises au téléphone ou au comptoir.",
    youNeed: ["Rien"],
    weDo: ["Les marquer comme Manuel, jamais comme l'un des canaux connectés"],
  },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Besoin d'aide ?"
        subtitle="Ce que vous avez sous les yeux, et ce qui se passe quand vous voudrez le connecter à vos vrais comptes."
        actions={<DemoChip />}
      />

      <Card className="max-w-[75ch]">
        <h2 className="text-[15px]">Vous êtes en mode démonstration</h2>
        <div className="mt-2 flex flex-col gap-2 text-sm text-muted">
          <p>
            Chaque client, message et commande que vous voyez a été inventé pour cette
            démonstration. Aucun compte Instagram, WhatsApp, Facebook ou Google n'est connecté, et
            rien de ce que vous faites ici n'atteint un client.
          </p>
          <p>
            L'intérêt de la démonstration est de vous laisser juger le produit avant de donner accès
            à quoi que ce soit. Attribuez une conversation, filtrez les commandes par source, et
            voyez si les réponses vous conviennent.
          </p>
          <p>
            L'étape suivante est une vraie base de données et un moyen de se connecter. Ensuite, le
            formulaire du site web sera le premier connecteur, parce que c'est le seul qui ne demande
            rien à Meta ni à Google.
          </p>
        </div>
      </Card>

      <section className="grid gap-3 lg:grid-cols-2">
        {GUIDES.map((guide) => (
          <Card key={guide.id} className="scroll-mt-24" >
            <div id={guide.id} className="flex items-start justify-between gap-3">
              <h2 className="text-[15px] leading-tight">{guide.title}</h2>
              <SourceBadge channelId={guide.channelId} size="sm" />
            </div>
            <p className="mt-2 text-[13px] text-muted">{guide.what}</p>

            <p className="os-label mt-3">Ce dont vous avez besoin</p>
            <ul className="mt-1 flex flex-col gap-1 text-[13px]">
              {guide.youNeed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <p className="os-label mt-3">Ce que fait Les Saveurs du Cap Bon</p>
            <ul className="mt-1 flex flex-col gap-1 text-[13px]">
              {guide.weDo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            {guide.gotcha ? (
              <p className="mt-3 rounded-[var(--radius-sm)] border border-accent-line bg-accent-soft px-3 py-2 text-[12px] text-accent-ink">
                {guide.gotcha}
              </p>
            ) : null}
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted">
        Envie de voir ce qui est connecté ?{" "}
        <Link href="/integrations" className="font-semibold text-primary hover:underline">
          Ouvrir Intégrations
        </Link>
        .
      </p>
    </div>
  );
}
