# Launch Plan — seo-superpower

## 1 — Single-tweet launch (the hook)

Three variants. **Favorite: C** — price contrast stops the scroll; the GEO stat makes it shareable by SEO Twitter.

---

**A**
> Your SEO checklist is rotting in Notion. `/seo-superpower` is a Claude Code plugin: one command → one PR. Reads your actual codebase. Runs Lighthouse + GSC in parallel. GEO-native. No Ahrefs. No subscriptions. $0.
> github.com/benskamps/seo-superpower

*Rationale: leads with universal pain (Notion docs nobody acts on), pays off with the PR framing. Works for founders mid-funnel who already feel the gap.*

---

**B**
> Just shipped a Next.js site? Type `/seo`. Claude reads your codebase, pulls GSC data, and opens a PR: sitemap, schema, content gaps, GEO signals. One pass. Free-tier only. No dashboards.
> github.com/benskamps/seo-superpower

*Rationale: activates the "just shipped" urgency — highest-intent moment. The deliverable list is a fast proof-of-value scan for technical readers.*

---

**C ⭐**
> Ahrefs: $199/mo. Surfer: $129/mo. `/seo-superpower`: $0.
>
> Claude Code plugin — reads your codebase, runs Lighthouse + GSC in parallel, opens a PR. GEO-native (AI search is 12% of informational queries now, up 527% YoY).
>
> github.com/benskamps/seo-superpower

*Rationale: price stack is a scroll-stopper and the GEO stat is citation-worthy. Shareable by SEO people who'll debate the numbers — all press.*

---

## 2 — Launch thread

**Tweet 1 — Hook** *(different from Artifact 1)*
> SEO has a coordination problem.
>
> The data lives in Ahrefs. The fixes live in GitHub. The strategy lives in a Notion doc no one reads. The actual site lives in your editor.
>
> There's now a plugin that closes all four into one command. 🧵

**Tweet 2 — Why this exists**
> Other Claude SEO tools require DataForSEO ($60+/mo). Ahrefs, Surfer, and Semrush cost $130–500/mo and live outside your editor.
>
> Founders who just shipped have neither. So they skip SEO and lose 6 months of compounding traffic.
>
> seo-superpower runs entirely on free-tier Google APIs. Zero subscriptions. Zero leaving Claude Code.

**Tweet 3 — What it does (3 skills)**
> Three moves it makes for you:
>
> • `/seo bootstrap` — Day-1 PR: sitemap, robots.txt, OG image, JSON-LD. Auto-detects Next.js / Astro / SvelteKit.
>
> • `/seo underserved` — Finds striking-distance keywords (pos 5–15 in GSC) you already rank for but never mention. Opens a refresh PR.
>
> • `/seo geo-check` — Polls ChatGPT, Perplexity, Claude, Gemini for citations of your domain. Tracks delta over time.

**Tweet 4 — The wedge**
> 13 skills total. 4 MCP tools bundled: GSC, PageSpeed Insights, GEO tracker, schema validator.
>
> All on free-tier APIs.
>
> Ahrefs alerts when traffic drops.
> This opens the PR that fixes it.

**Tweet 5 — The activation moment**
> Setup is 5 minutes. Literally.
>
> `/seo-setup` opens Google Cloud for you, walks you through OAuth click-by-click, validates everything, and prints ✅.
>
> No prior SEO knowledge. No cloud experience needed. If you can click "Create" you can install this.

**Tweet 6 — Killer feature teaser**
> The feature nobody else ships: GEO Diff Bot.
>
> It polls ChatGPT/Perplexity/Claude daily, diffs AI citations vs. yesterday, and correlates losses to recent commits via `git blame`.
>
> When your AI-search visibility drops, you'll know exactly which deploy caused it.

**Tweet 7 — Install**
> ```
> /plugin marketplace add benskamps/seo-superpower
> /plugin install seo-superpower
> /seo-setup
> ```
> Then type `/seo` in any project.
>
> That's the whole product.

**Tweet 8 — CTA**
> MIT-licensed. Skills are markdown files — open a PR to add one.
>
> Built in one session on Claude Code. Runs on tools you already have.
>
> github.com/benskamps/seo-superpower

---

## 3 — Demo video storyboard (60-second cut)

**Target site:** roadtripper.ai (Next.js, known audit findings — ideal live demo)

| # | Timecode | On screen | Narrator says | Wow-moment |
|---|---|---|---|---|
| 1 | 0:00–0:07 | Terminal: `/plugin install seo-superpower` → `✅ installed in 3s` | "Three commands. Five minutes. You won't come back to this screen." | Instant install — no npm maze, no config file hunting. |
| 2 | 0:07–0:16 | `/seo-setup` wizard: browser tabs auto-open (Google Cloud), OAuth flow, `✅ Setup complete — type /seo in any project` | "It opens Google Cloud for you. You click Create three times." | Non-technical founders see this and trust the product. |
| 3 | 0:16–0:26 | Terminal: `/seo` on roadtripper.ai — parallel spinner lines: `► lighthouse running`, `► gsc fetching` simultaneously | "It runs Lighthouse and GSC in parallel. You do nothing." | The 'doing real work' beat — feels like an agent, not a script. |
| 4 | 0:26–0:36 | Audit output: `✗ Missing Organization JSON-LD`, `✗ robots.txt blocks /assets/`, `✗ 3 pages at pos 6–12 never mention their ranking query` | "Here's what's blocking you — three things, ranked by traffic impact, with file paths." | Specificity. Not 'improve your SEO' — actual file names and line numbers. |
| 5 | 0:36–0:46 | GitHub PR diff: `app/sitemap.ts` (new), `public/robots.txt` (fixed), `app/blog/post.mdx` (striking-distance keyword woven in naturally) | "It opened the PR. You're reviewing code, not reading a report." | The PR framing is the product's entire thesis in one frame. |
| 6 | 0:46–0:54 | Terminal: `geo_diff` output — `ChatGPT citations: yesterday 2 → today 1 — correlated to commit abc123 (removed FAQ section)` | "It noticed ChatGPT stopped citing you after your last deploy." | Nobody else ships this. The GEO diff is the 'how?' moment. |
| 7 | 0:54–1:00 | Terminal idle. Overlay text: `$0/mo` then `github.com/benskamps/seo-superpower` | "Free Google APIs. No subscriptions. Type /seo next time you ship." | Close on the wedge — $200+/mo vs. $0, locked in. |

---

## 4 — Distribution checklist

### Post order (by expected impact)

- [ ] **X/Twitter — thread first.** Post between 9–11 AM ET, Tuesday or Wednesday. Pin the hook tweet (C from §1) as the first reply to drive follows. Don't cross-post all 8 tweets at once — schedule them 2 minutes apart so X treats them as a real thread.
- [ ] **Hacker News — "Show HN."** Title: `Show HN: SEO for developers – Claude Code plugin that ships fixes as PRs (free-tier only)`. Post at 9 AM ET Tuesday. Respond to every early comment within 30 minutes — velocity in the first hour is everything.
- [ ] **r/nextjs** — title: `I built a Claude Code plugin that auto-PRs your sitemap, schema, and GSC gaps. Free-tier, no Ahrefs.` Drop a screenshot of the PR diff. Next.js devs are the bullseye.
- [ ] **r/SEO** — title: `Open-source SEO tool for devs: ships fixes as PRs instead of dashboards.` Different angle — focus on the GEO Diff Bot feature here.
- [ ] **r/ClaudeAI** — straightforward demo post. This community already understands the plugin system.
- [ ] **dev.to** — publish: `SEO as code: how I turned /seo into a merged PR in one session.` Include the storyboard as a section. Link to repo at the end.
- [ ] **Indie Hackers** — "Share your product." Lead with MRR: $0. Lead with the one-session shipping story. Include a before/after GSC screenshot once you have 7 days of data.

### Awesome-list PRs (highest reach first)

- [ ] `VoltAgent/awesome-agent-skills` — 1,000+ skills, updated daily, broadest distribution. Add under "Developer Productivity > SEO".
- [ ] `ComposioHQ/awesome-claude-plugins` — active 2026 plugin directory. Add under SEO/marketing category.
- [ ] `ComposioHQ/awesome-claude-skills` — skills-specific list; submit each major skill individually.
- [ ] `hesreallyhim/awesome-claude-code` — 8.7k stars; high-signal curation, catches a different audience.

### Direct outreach (DM, not cold pitch)

- [ ] **@leeerob** (Lee Robinson, Vercel Head of Product) — frame: "plugin that makes any new Next.js site rankable in 5 minutes." He amplifies developer tools constantly and his audience is exactly right.
- [ ] **@rauchg** (Guillermo Rauch, Vercel CEO) — lead with the GEO angle. He's been vocal about AI search cannibilizing click traffic. One RT = 10× distribution.
- [ ] **@alexalbert__** (Alex Albert, Anthropic DevRel) — he actively highlights community-built Claude Code plugins on X. This is literally his beat; send the repo link and a one-line description.

### Follow-up cadence

- [ ] **Day 3:** Quote-tweet the original thread with a short video of the GEO diff feature. Hook: "Most-asked question: does this work on [X framework]? Yes. Here's the output."
- [ ] **Day 7:** Post a before/after — roadtripper.ai GSC impressions 7 days post-install. Real numbers beat any copy.
- [ ] **Day 14:** Indie Hackers update + a new tweet: "Two weeks in — [N] installs, top issue requested, what ships next." Close the public loop; it seeds the next launch moment.
