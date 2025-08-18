# Project Structure

```
brand-matching-app/
├── app/
│   ├── api/
│   │   ├── brands/
│   │   │   ├── route.ts            # API endpoints for brands
│   │   ├── brand-groups/
│   │   │   ├── route.ts            # API endpoints for brand groups
│   │   ├── match/
│   │   │   ├── route.ts            # Fuzzy matching endpoint
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page (dashboard)
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── brand-table.tsx             # Brand listing table
│   ├── brand-comparison.tsx        # Side-by-side comparison view
│   ├── brand-match-form.tsx        # Form for matching brands
│   ├── brand-group-dialog.tsx      # Dialog for creating brand groups
├── lib/
│   ├── db.ts                       # Database connection
│   ├── utils.ts                    # Utility functions
│   ├── constants.ts                # App constants
├── types/
│   ├── index.ts                    # TypeScript types
├── prisma/
│   ├── schema.prisma               # Database schema
├── next.config.js
├── package.json
├── tsconfig.json
```