# Mantis Alien — mantisalien.com

Static site (no build step). Hosted on GitHub Pages.

## Pages
- `index.html` — landing page and launch shop
- `offer.html` — paid-ads destination (Field Manual, price, Buy)
- `waitlist.html` — where every Buy button lands (fake-door test: "not released yet, nothing charged")
- `community.html` — submit stories and artwork (reviewed by a person before anything is shown)
- `privacy.html` — draft policy

## Before running ads (5 minutes)
1. **Meta Pixel + Google**: edit `assets/tracking.js`, replace `REPLACE_WITH_...` with your Pixel ID, GA4 Measurement ID and (optional) Google Ads ID / conversion labels.
2. **Meta domain verification**: paste the `<meta name="facebook-domain-verification">` tag from Business Settings into the head of each page (marked with a comment).
3. **Forms**: entries email to the inbox set in `assets/forms.js` (`INBOX`) via FormSubmit. The first submission sends one activation email; click it once. After that, replace `INBOX` with the alias FormSubmit gives you so the address is not public.
4. **Prices**: change them directly in `index.html` / `offer.html` (search for `class="price"`).

## Events
| Action | Meta | GA4 |
|---|---|---|
| Any page (after consent) | PageView | page_view |
| Offer page, shop section seen | ViewContent | view_item |
| Click any Buy button | InitiateCheckout | begin_checkout |
| Email left (waitlist / signal) | Lead | generate_lead |
| Community entry confirmed | SubmitStory (custom) | submit_story |
| Scroll 25/50/75/90% | ScrollDepth (custom) | scroll_depth |

Microsoft Clarity (project `yt87zcnroy`) loads after consent and receives every event above as a Clarity custom event, so recordings can be filtered by e.g. `begin_checkout`.

Tracking loads only after the visitor accepts the consent banner. UTM parameters are stored for the session and included in every emailed form entry so you can see which ad produced each lead.

## Ad URLs
- Field Manual ads: `https://mantisalien.com/offer.html?utm_source=facebook&utm_medium=paid&utm_campaign=creative-test&utm_content=ad1-abyt`
- Brand/shop ads: `https://mantisalien.com/?utm_source=facebook&utm_medium=paid&utm_campaign=creative-test&utm_content=ad2-purple`
