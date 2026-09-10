# Les Saveurs du Cap Bon - Operating Rules

This file stands on its own. When this folder is opened as the workspace root, in
Cowork or any other desktop sandbox, the workspace-root `CLAUDE.md` sits outside
the sandbox and cannot be read. Everything an agent needs in order to work here
safely is in this file or reachable from this folder.

## Recall before work

1. Read `MEMORY.md` in this folder before answering anything, including a
   one-line question. It is the routing table for this folder and it carries the
   machine-maintained recall block.
2. Before real work on a person or a project, read the matching file in
   `.memory/people/` and `.memory/projects/` inside this folder. Surface whatever
   is dated in there, a decision, a deadline, a status change, a commitment made
   to a client, without waiting to be asked. If no file exists yet for that
   person or project, say so once and carry on.
3. Search the vault before searching the disk by hand. With the whole workspace
   open, run `python3 .memory/.system/bin/mem search "your query"` from the
   workspace root; that CLI works inside Cowork's sandbox as well as in a
   terminal. With only this folder open, the CLI sits outside the sandbox, and
   the `<!-- auto:memory -->` block in `MEMORY.md` is the recall surface instead.
   It is refreshed for you.
4. Never hand-edit anything between the `<!-- auto:memory -->` markers in
   `MEMORY.md`. The worker owns that block and overwrites whatever is put there.
   A correction goes to `.memory/_inbox/pending/` at the workspace root as a
   dated proposal.

## Memory write rules

- **The ephemeral gate.** A real ongoing workstream gets its own file in `.memory/projects/`. A one-off that belongs to an existing project gets appended to that project's work log, and a one-off with no parent gets a dated line there. Never create files like "reply to X" or "notes before Tuesday call".
- **Absolute dates always.** Convert before saving. Never "yesterday" or "next week".

## The brief gate

Before any major request, get these five answers on the table. Fill in what the workspace
already tells you, show her what you filled in, and ask only about what is genuinely missing.
Asking her things her own memory vault already knows is a failure of this rule, not an
application of it.

A request is major when it produces something that leaves the chat (a document, a page, a
deck, a carousel, a script, an email, code that ships), when it touches a client, or when
getting it wrong costs more than a few minutes. A one-line question is not major. Neither is
the next step of a brief she already approved.

1. **Outcome, in business terms.** Not "design a page". "Convince Waseem to pay for a page."
   What has to change for whom once this lands.
2. **What I cannot see.** The client by name (then read their file in `.memory/people/`), the
   constraints, the audience, and above all what already failed. If round one was wrong, say
   what was wrong with it rather than describing the whole thing again.
3. **What good looks like.** Give a reference. Adjectives do not carry taste. Best case is a
   path to something that already exists here, a past carousel or the brand charter, because
   a file she already approved settles an argument that words cannot.
4. **Where it goes.** Which folder, which channel, which language, what shape, what length.
   A 6-slide carousel and a 2-page PDF are not the same brief, and neither is French and English.
5. **Where I stop.** The default is a draft, then her review, per Draft first, then approval.
   Say which slice of the work that draft covers, so she is not handed a finished deck when
   she wanted the outline.

When an output comes back wrong, one of the five was missing. Find out which one before rewriting.

## Scope

Everything for one client, Les Saveurs du Cap Bon, a fine grocery in Nabeul: the order
workspace that gathers their orders from a website form, WhatsApp Business, Instagram,
Facebook Messenger, Google Ads lead forms and the counter, plus the demo shown to them and
the notes behind it. These rules apply to every file in this folder.

## Domain rules

1. **The source of an order is never rewritten.** An order stores the id of a source
   attribution record, never a channel string, and every screen resolves it through
   `src/lib/domain/attribution.ts`. That resolver throws rather than falling back to a
   friendly word, because an order labelled "Online" when the truth is known is the failure
   this product exists to prevent. If a screen needs to show where something came from, use
   `SourceBadge` or `ChannelDot`, never a hand-written string.
2. **Nothing is connected, and no screen may imply otherwise.** No Instagram, WhatsApp,
   Facebook or Google account is linked, no credentials are stored, and no send button
   reaches a customer. The visible demo label must keep saying that no account is connected.
   Moving those words into a tooltip is not good enough, and has been done twice already.
3. **Their real details are not ours to invent.** Product names, prices, stock, SKUs, the
   shop address, the phone number and the VAT number are demo placeholders. The Products
   screen says so on the page. Do not replace a placeholder with a guess; ask Sarra for the
   real value or leave it reading "not set yet".
4. **What is verified about the business, and what is not.** Verified from their public
   Instagram profile on 2026-09-09: the handle `@lesmillesaveursducapbon`, the profile name
   "Les 1000 Saveurs du capbon", the category "Epicerie fine", the website
   `lesmillesaveursducapbon.com`. Everything else, including the pistachio and dessert
   focus, came from Sarra's own brief, not from anything readable on the page.
5. **Two published copies exist.** The public demo at `https://omnishop-ten.vercel.app` and
   the public repository at `https://github.com/sara3699/Les-Saveurs-du-Cap-Bon`. Publishing
   to either is one of Sarra's hard red lines, so ask before deploying or pushing. This Mac
   has no GitHub credentials for the command line; pushes go through GitHub Desktop.

## What not to do

- Do not invent product names, prices or stock and present them as the client's real
  catalogue, and never claim data was imported from Instagram when it was not.
- Do not soften or hide the demo-data label anywhere in the interface.
- Do not commit environment files, tokens or webhook secrets. `.gitignore` covers them;
  keep it that way. The repository is public.
- Do not add a button that pretends to send, export or save. If a capability is designed
  but not built, the screen says so in one plain sentence.
- Do not rename the folder or move the project without telling Sarra: the Vercel link, the
  git remote and GitHub Desktop all point at this path.

## Next.js note

@AGENTS.md
