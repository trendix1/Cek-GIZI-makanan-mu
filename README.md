GiziLearn — Final (Futuristic, Public, Client-side)
====================================================

This version is tuned for public deployment on Vercel and prepared to meet common requirements for Google Search indexing & Google AdSense.

What changed:
- Futuristic dark/neon UI (Tailwind classes + small CSS tweaks).
- SEO friendly: meta tags, canonical, OpenGraph, structured data (JSON-LD), robots.txt, sitemap.xml, manifest.json.
- Privacy & Contact pages included (required for AdSense).
- All processing (OCR + evaluator) runs client-side — no paid APIs required.
- localStorage used for history. No user data is sent to any server by default.

AdSense readiness checklist included in README below (important):
1. Unique, substantial content on the site (not thin pages). Add articles, guides, or lessons about nutrition — AdSense prefers original content.
2. Privacy Policy page — included. Make sure it accurately reflects your real data practices and includes contact info.
3. Contact page — included. Use a real email before submitting to AdSense.
4. Site ownership verified in Google Search Console — follow Google's steps and add sitemap.xml.
5. HTTPS — Vercel provides automatic SSL.
6. Avoid copyright/DMCA issues (use original images or properly licensed images).
7. Comply with AdSense content policies (no adult, hate, or pirated content).
8. Ensure good UX on mobile (responsive) and reasonable page speed.
9. Do not include too many ads initially; wait until site has decent content and traffic.

Deployment (quick):
- Install dependencies: `npm install`
- Build: `npm run build`
- Push to GitHub and connect the repo to Vercel, or `vercel` CLI deploy.
- In Google Search Console: add property, verify ownership, submit sitemap at /sitemap.xml.
- In Google AdSense: register site, add privacy/contact pages, and follow their verification process.

If you want, I can now pack this project into a ZIP ready to download and deploy to Vercel.
