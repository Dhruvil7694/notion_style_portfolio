# Mobile QA Audit

Run this checklist in Chrome DevTools (Device toolbar) before production launch.
Open DevTools → Toggle device toolbar → test each breakpoint.

## Breakpoints

| Label  | Width  | Represents                        |
| ------ | ------ | --------------------------------- |
| XS     | 320px  | Small Android phones              |
| SE     | 375px  | iPhone SE / older iPhones         |
| iPhone | 390px  | iPhone 14/15 Pro                  |
| Tablet | 768px  | iPad mini, small tablets          |
| Laptop | 1024px | iPad Pro landscape, small laptops |

---

## Test Matrix

For each page, verify all 5 breakpoints unless noted.

### Global (applies to every page)

- [ ] No horizontal scroll / overflow-x
- [ ] No text clipped by container edge
- [ ] No buttons/links outside safe tap zone (<44px)
- [ ] Navigation dock visible and usable
- [ ] Dark mode renders correctly at all widths

---

### Homepage `/`

- [ ] Hero text legible at 320px
- [ ] Profile photo not stretched or cropped oddly
- [ ] CTA buttons full-width or min 280px wide
- [ ] Featured projects grid stacks to single column at ≤768px
- [ ] No overlapping elements in the dock area

---

### Projects `/projects`

- [ ] Project card grid → 1 column at ≤640px
- [ ] Tech stack badges wrap cleanly, no overflow
- [ ] Filters/search accessible without horizontal scroll

---

### Project Detail `/projects/[slug]`

- [ ] Hero image responsive, not cut off
- [ ] Architecture diagram scrollable horizontally at 320px (not cut)
- [ ] Code blocks have horizontal scroll, not overflow
- [ ] Related content section stacks vertically
- [ ] FAQ accordion items fully tappable
- [ ] AI summary block doesn't break layout

---

### Research `/research` + `/research/[slug]`

- [ ] List view: readable at 320px
- [ ] Detail: key takeaways section stacks correctly
- [ ] Related knowledge links tappable (min 44px height)

---

### Writing `/blog` + `/blog/[slug]`

- [ ] Same checks as research detail
- [ ] Long-form prose has correct line-height and max-width

---

### Automations `/automations` + `/automations/[slug]`

- [ ] Same as writing/research

---

### Expertise `/expertise/[slug]`

- [ ] Expertise hub: related items grid → 1 column at ≤640px
- [ ] Technology badges wrap cleanly

---

### Technology `/technology/[slug]`

- [ ] Hub page: project grid stacks correctly
- [ ] Concept links tappable

---

### Search

- [ ] Search bar expands full width at 320px
- [ ] Results panel doesn't extend past viewport
- [ ] Result items have ≥44px tap target
- [ ] Keyboard shortcut badge hides at mobile (Ctrl K / ⌘K)

---

### Explore `/explore`

- [ ] Navigation UI usable at 320px
- [ ] No hidden overflow on entity cards

---

### Assistant (chat panel)

- [ ] Drawer/panel fits within viewport at 320px
- [ ] Input field reachable above keyboard
- [ ] Message bubbles don't overflow
- [ ] Source citations visible and tappable
- [ ] Suggestion chips wrap correctly

---

### Resume `/resume`

- [ ] PDF preview renders or shows fallback
- [ ] Download button full-width at 320px

---

### Contact `/contact`

- [ ] Email and calendly links tappable (≥44px)
- [ ] Social links not cramped

---

### Admin Login `/admin/login`

- [ ] Form fields full-width at 320px
- [ ] Submit button accessible
- [ ] Error messages visible without overflow

---

## How to Test

```bash
# Start dev server
npm run dev

# Open Chrome → DevTools → Device Toolbar
# Select each width: 320, 375, 390, 768, 1024
# Step through pages above
```

Alternatively, test on real devices:

- iPhone (Safari) — most important for iOS Safari quirks
- Android Chrome — check touch targets
- iPad Safari — check tablet layout

---

## Known Mobile Concerns

- Architecture diagrams (`@xyflow/react`, `@joint/react`): may require horizontal scroll at 320px — this is acceptable if a scroll affordance is visible.
- Tiptap editor: admin-only, mobile support is best-effort.
- Chat assistant: test keyboard push-up behavior on iOS Safari.

---

## Pass Criteria

| Breakpoint | Must pass                                  |
| ---------- | ------------------------------------------ |
| 320px      | No horizontal overflow, all CTAs reachable |
| 375px      | Same as 320px                              |
| 390px      | Same, plus verify dock layout              |
| 768px      | Two-column layouts render correctly        |
| 1024px     | Full layout, no broken grid gaps           |

Mark each section above as `[x]` when verified.
Last audited: ********\_********
Auditor: ********\_********
