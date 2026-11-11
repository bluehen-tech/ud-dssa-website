# Pages and components

:::short
- Each page of your site is a file. The folder the file is in sets the page's address.
- A **component** is a piece of a page that you write once and use many times.
- Short words called **classes** set how things look.
- A list, such as your events, can sit in its own file. The page reads the list.
:::

## The toolkit behind the pages

Your starter site and bluehen-dssa.org are both built with **Next.js**. Next.js is a toolkit for building websites. It turns files in your project into pages.

## Files are pages

Each file named `page.tsx` inside the `src/app` folder is a page. The folders above it give the page its address. These are real files in the DSSA [[repo]]:

| File | Address |
| --- | --- |
| `src/app/page.tsx` | bluehen-dssa.org/ |
| `src/app/members/page.tsx` | bluehen-dssa.org/members |
| `src/app/events/page.tsx` | bluehen-dssa.org/events |

To add a page, you add a folder and a `page.tsx` file inside it.

:::more What is inside a page.tsx file
A page file says what the page shows. Here is a whole page:

```tsx
export default function Home() {
  return <h1>Jordan Lee</h1>;
}
```

The part after `return` is what appears on the page. `<h1>` marks a main heading. The agent writes these files. Your job is to read them and check they match what you asked for.
:::

## Components

A **component** is a piece of a page that you write once and use many times. On bluehen-dssa.org/members, every card is the same `MemberCard` component. Each card is given a different member's details: name, photo, skills.

The details given to a component are its **props**:

```tsx
<MemberCard name="Jordan Lee" major="Data Science" />
```

Here `name` and `major` are props.

## Styling with Tailwind CSS

**Tailwind CSS** sets how a page looks with short words called **classes**. Each class does one thing.

```tsx
<h1 className="text-3xl font-bold text-blue-primary">Jordan Lee</h1>
```

`text-3xl` makes the text large. `font-bold` makes it bold. `text-blue-primary` uses UD blue.

:::more Where the UD colors come from
The DSSA site and your starter both add two colors of their own to Tailwind: `blue-primary` and `gold`. They are set in a file named `tailwind.config.js`.
:::

## Lists in a data file

The DSSA site keeps some lists in plain files. The data science clubs on the Get Connected form come from `src/data/clubs.ts`. The form reads that list and shows one choice per club. To add a club, you edit the list, not the form.

You will do the same with events: a list in a data file, and a page that shows one card per event.
