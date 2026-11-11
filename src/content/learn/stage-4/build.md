Open `my-dssa-site` in Cursor. Start the site with `npm run dev` in the [[terminal]], and keep [localhost:3000](http://localhost:3000) open in your browser while you work.

## 1. Add a photo

Copy a photo of yourself into the `public` folder of `my-dssa-site` and name it `me.jpg`. You can use the same photo as your DSSA portfolio.

## 2. Rebuild the member card

Ask the agent:

> Create a component in src/components/MemberCard.tsx. It shows a round photo, a name, a major, a short bio, and up to three skills. Use Tailwind classes and the blue-primary color. Then show one MemberCard on the home page with my details: photo /me.jpg, name ___, major ___, bio ___, skills ___. Explain each file you change.

Read the [[diff]]. You should see one new file and one changed file. Find the props and the Tailwind classes from the lesson. Ask the agent about anything you cannot explain.

Do this now: look at localhost:3000. Your card should appear. Compare it with your card on [bluehen-dssa.org/members](/members).

Commit and push:

```
git add -A
git commit -m "Add MemberCard component"
git push
```

## 3. Add an events page

Ask the agent:

> Create src/data/events.ts with a list of three made-up events. Each has a title, a date and a location. Create a page at src/app/events/page.tsx that shows each event as a card, soonest first, using Tailwind. Add a link to the events page from the home page. Explain each file you change.

Do this now: open [localhost:3000/events](http://localhost:3000/events). You should see three cards.

## 4. Change the data by hand

Open `src/data/events.ts` in the editor. Change one event title yourself and save.

Do this now: look at the events page. The new title should appear without any other change. This shows the page reads from the file.

Commit and push:

```
git add -A
git commit -m "Add events page"
git push
```

## Done when

- [ ] Your member card shows on your home page
- [ ] /events shows a card per event, soonest first
- [ ] Editing events.ts changed the page
- [ ] Both changes are live on your `.vercel.app` site
