# Brancher le formulaire du site

Le site de la boutique envoie ses commandes à une adresse de cet espace de travail.
C'est le seul connecteur qui ne demande d'autorisation à personne : ni Meta, ni Google,
ni examen d'application. Une clé, une adresse, et les commandes arrivent.

## L'adresse

```
POST https://omnishop-ten.vercel.app/api/intake/website
Content-Type: application/json
Authorization: Bearer <la clé>
```

En local, remplacez le début par `http://localhost:3100`.

## La clé

La clé est émise depuis l'écran Intégrations, sur la carte du site, par la propriétaire
de la boutique. Elle n'est affichée qu'une seule fois : seule son empreinte est
conservée, donc personne, pas même nous, ne peut la relire ensuite. En émettre une
nouvelle rend l'ancienne inutilisable.

**La clé vit sur le serveur du site, jamais dans une page que le visiteur peut lire.**
Un formulaire qui l'envoie directement depuis le navigateur la donne à tout le monde.
Le site reçoit la soumission, puis son serveur la transmet ici.

**Ni dans un fichier suivi par git.** La première clé avait été écrite en clair dans un
fichier de test, dans un dépôt public. Elle a été remplacée le 2026-09-11 : l'ancienne
n'ouvre plus rien. Effacer la ligne n'aurait pas suffi, car l'historique de git la
conserve ; seule une nouvelle clé annule la précédente. La clé de travail est maintenant
dans `.env.local`, que `.gitignore` couvre, sous le nom `WEBSITE_INTAKE_KEY`.

## Deux formes, une seule adresse

Une soumission qui porte des articles est une **commande**. Une soumission sans
articles est une **demande**, qui devient une conversation à laquelle la boutique peut
répondre. Les deux gardent Site web comme source, pour toujours.

### Une commande

```json
{
  "reference": "CDE-2026-0912",
  "name": "Rania Trabelsi",
  "phone": "+216 20 114 882",
  "city": "Ariana",
  "page": "lesmillesaveursducapbon.com/panier",
  "delivery_fee": 7.5,
  "items": [
    { "name": "Crème de pistache", "sku": "LMS-PIS-01", "quantity": 2, "unit_price": 42 }
  ]
}
```

### Une demande

```json
{
  "reference": "MSG-2026-0912",
  "name": "Slim Ayari",
  "email": "slim.ayari@outlook.com",
  "subject": "Livraison à Sousse",
  "message": "Est-ce que vous livrez à Sousse avant vendredi ?"
}
```

## Les champs

| Champ | Obligatoire | Ce qu'il contient |
| --- | --- | --- |
| `name` | oui | Le nom du client |
| `phone` ou `email` | l'un des deux | De quoi rappeler ou répondre |
| `reference` | non, mais recommandé | Votre identifiant de la soumission. Voir plus bas |
| `city` | non | La ville, utile pour la livraison |
| `page` | non | La page où était le client |
| `campaign` | non | La campagne, si la visite vient d'une publicité |
| `subject`, `message` | non | Pour une demande sans articles |
| `items` | non | Chaque article : `name`, `sku`, `quantity`, `unit_price` |
| `delivery_fee` | non | Les frais de livraison, ajoutés au total |

## Envoyer deux fois ne crée rien deux fois

Si votre serveur n'obtient pas de réponse et réessaie, envoyez la même `reference`.
La deuxième fois répond `200` avec `duplicate: true` et n'écrit rien. Sans
`reference`, l'empreinte du contenu sert de repère, ce qui protège moins bien :
donnez-en une.

## Les réponses

| Code | Ce que ça veut dire |
| --- | --- |
| `201` | Reçu et enregistré. `reference` contient le numéro de commande, ou `null` pour une demande |
| `200` | Déjà reçu. Rien n'a été créé |
| `400` | Un champ manque ou n'est pas valide. `details` dit lequel |
| `401` | Clé absente ou refusée |
| `429` | Trop d'envois. Plus de 60 en une minute |
| `502` | L'enregistrement a échoué de notre côté. Réessayez |

## Un exemple, côté serveur du site

```bash
curl -X POST https://omnishop-ten.vercel.app/api/intake/website \
  -H "Authorization: Bearer $SAVEURS_INTAKE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"reference":"CDE-2026-0912","name":"Rania Trabelsi","phone":"+216 20 114 882",
       "items":[{"name":"Crème de pistache","sku":"LMS-PIS-01","quantity":2,"unit_price":42}]}'
```

## Ce que la boutique voit ensuite

La commande apparaît dans Commandes avec le badge Site web, la page d'où elle vient,
et le client rattaché. Si le numéro ou l'e-mail correspond à un client déjà connu, la
commande va sur sa fiche plutôt que d'en créer une deuxième, et son premier canal
n'est jamais réécrit.
