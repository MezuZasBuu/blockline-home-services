# Blockline visual system

Milestone 2A establishes the public presentation layer only. It has no customer-data collection or workflow connections.

## Direction

Urban, understated, contemporary, and neighborhood-oriented. A typographic BLOCKLINE wordmark, ink blue, paper white, brick-red accents, restrained borders, and editorial serif accents connect the brand to homes and blocks without handyman graphics, roof icons, tools, or construction motifs.

Use direct language that makes Blockline the accountable service company. Do not introduce public contractor profiles, marketplace comparisons, testimonials, completed-job claims, certifications, live availability, or unapproved prices.

## Tokens

Source: `src/app/tokens.css`.

| Token group | Values / intent |
|---|---|
| Ink | `#172f40`; headings, primary actions, footer |
| Paper | `#fcfcfa`; main background |
| Surface | `#edf0ef`; quiet service and neighborhood sections |
| Brick | `#a54732`; small accents and focus outlines |
| Muted text | `#53616a`; supporting copy |
| Sans typography | Arial / Helvetica / system sans; no remote font dependency |
| Editorial typography | Georgia / Times New Roman / serif |
| Spacing | 4, 8, 16, 24, 32, 48, 64, 96 px equivalents in rem |
| Page | 80rem maximum; responsive gutters from 1.25rem |
| Section rhythm | Responsive 4rem–7.5rem |
| Controls | 3.25rem regular height; 2.75rem small buttons/menu |
| Corners | .2rem controls; .3rem cards |

Headings use a fluid scale; paragraph text is at least 1rem. Small metadata uses .8125rem–.875rem. Main text remains high contrast. Visible keyboard focus, reduced-motion handling, native control semantics, and a skip link are part of the baseline.

## Components

| Component | Location | Purpose |
|---|---|---|
| `PublicHeader` | `src/components/public/header.tsx` | Brand, section navigation, mobile disclosure |
| `PublicFooter` | `src/components/public/footer.tsx` | Brand, real section links, prelaunch status |
| `Brand` | `src/components/public/brand.tsx` | Two-line BLOCKLINE / Home Services wordmark |
| `Container` | `src/components/public/container.tsx` | Consistent page width and gutters |
| `Section` | Same file | Consistent section spacing and semantic section element |
| `Button` | `src/components/ui/primitives.tsx` | Native button; primary/secondary/quiet; regular/small |
| `ButtonLink` | Same file | Styled native navigation link |
| `Card` | Same file | Reusable bordered surface |
| `Input`, `Select`, `Textarea`, `Checkbox` | Same file | Native form-control primitives only |
| `Field` | Same file | Label, hint, required indication, and associated error |

Buttons default to `type="button"` to avoid accidental submission. Use links for navigation and buttons for actions. Form primitives are available for later authorized work but are not placed on the homepage and do not submit or collect data.

Example field composition:

```tsx
<Field id="example" label="Example field" hint="A short instruction">
  {attributes => <Input {...attributes} name="example" />}
</Field>
```

The field supplies the control ID, `aria-describedby`, `aria-invalid` when needed, and native `required`. The render function preserves connections across native input, select, and textarea controls.

## Navigation and responsive behavior

The mobile menu is a non-modal disclosure. It exposes `aria-expanded` and `aria-controls`; it closes on Escape, outside pointer interaction, section selection, or switching to a desktop layout. Escape returns focus to the menu button. There is no focus trap or body lock because the navigation is not a modal dialog.

The default layout stacks content for mobile. At 42rem, service/principle/footer layouts gain columns. At 60rem, desktop navigation and the split hero appear. All links lead to existing homepage sections; no booking or account links are exposed.

## Content boundaries

The homepage contains a brand introduction, dryer-vent service placeholder, approach statement, Philadelphia neighborhood section, and footer. Pricing, service scope, and launch neighborhoods are explicitly pending. It says booking is not open yet. Public contact details, policy text, and service promises will require approved content in a later milestone; no fake phone number, address, or policy link was inserted.

The page retains `noindex, nofollow` during development. Existing application security headers and API behavior are unchanged.

## Image provenance

Project asset: `public/images/blockline-rowhomes.png` (1536 × 1024 PNG). Created with the built-in `image_gen__imagegen` tool, one generation, no variants. The image is an original fictional Philadelphia-inspired streetscape, not a customer's property, completed job, or documentary photograph. Its alt text identifies it as illustrative. It is served locally through Next.js Image optimization; no external image host is required.

Final generation prompt:

```text
Use case: photorealistic-natural
Asset type: architectural editorial image for the split homepage hero of BLOCKLINE Home Services, a modern understated Philadelphia home maintenance company.
Primary request: Create exactly one original fictional Philadelphia-inspired brick rowhouse streetscape with three or four attached homes. Dark ink-blue painted doors, pale stone steps, traditional window trim, and a little restrained green planting.
Style/medium: Photographic editorial architectural brand image, crisp real textures and natural proportions. Original fictional scene, not a depiction of a specific real property.
Composition/framing: Wide landscape approximately 3:2, eye-level architectural perspective, emphasizing facade details and stoops. Compose the central facade and stoop so the image remains attractive when cropped square or portrait for mobile and a split hero.
Lighting/mood: Soft bright overcast daylight; calm, urban, lived-in, trustworthy and contemporary.
Color palette: Warm natural brick balanced by ink-blue details, pale stone and restrained green.
Constraints: No people, vehicles, visible house numbers, signs, logos, text, watermarks, tools, workers, construction clichés or SaaS imagery.
```
