# Pages and components

## Files are pages

In Next.js, each `page.tsx` file inside `src/app` is a page. The folders above it give the page its address. These are real files in the DSSA repo:

| File | Address |
| --- | --- |
| `src/app/page.tsx` | bluehen-dssa.org/ |
| `src/app/members/page.tsx` | bluehen-dssa.org/members |
| `src/app/events/page.tsx` | bluehen-dssa.org/events |

To add a page, you add a folder and a `page.tsx` file inside it.

## Components

A **component** is a piece of a page that you write once and use many times. On bluehen-dssa.org/members, every card is the same `MemberCard` component. Each card is given a different member's details: name, photo, skills.

The details given to a component are its **props**:

```tsx
<MemberCard name="Jordan Lee" major="Data Science" />
```

## Tailwind CSS

**Tailwind CSS** styles a page with short class names. Each class does one thing.

```tsx
<h1 className="text-3xl font-bold text-blue-primary">Jordan Lee</h1>
```

`text-3xl` makes the text large. `font-bold` makes it bold. `text-blue-primary` uses UD blue. The DSSA site and the starter both define `blue-primary` and `gold`.

## Lists in a data file

The DSSA site keeps some lists in plain files. The data science clubs on the Get Connected form come from `src/data/clubs.ts`. The form reads that list and shows one choice per club. To add a club, you edit the list, not the form.

You will do the same with events: a list in a data file, and a page that shows one card per event.
