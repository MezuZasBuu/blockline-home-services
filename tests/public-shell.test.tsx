import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Home from '../src/app/page';
import { Button, ButtonLink, Field, Input, Select, Textarea, Checkbox } from '../src/components/ui/primitives';

describe('public shell boundaries', () => {
  it('renders a prelaunch page without forms, prices, or workflow links', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('Booking is not open yet.');
    expect(html).toContain('Scope and pricing coming soon');
    expect(html).not.toMatch(/<form|<input|\$149|href="\/(book|login|admin|contractor|api)/);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const link of html.matchAll(/href="#([^"]+)"/g)) expect(ids.has(link[1])).toBe(true);
  });

  it('provides an initially collapsed, labeled mobile navigation control', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="public-navigation"');
    expect(html).toContain('aria-label="Main navigation"');
    expect(html).toContain('href="#main-content"');
  });
});

describe('accessible reusable primitives', () => {
  it('defaults buttons to non-submit and retains native disabled/link semantics', () => {
    expect(renderToStaticMarkup(<Button disabled>Unavailable</Button>)).toContain('type="button"');
    expect(renderToStaticMarkup(<Button disabled>Unavailable</Button>)).toContain('disabled=""');
    const link = renderToStaticMarkup(<ButtonLink href="#service">Read more</ButtonLink>);
    expect(link).toContain('<a');
    expect(link).not.toContain('role="button"');
  });

  it('connects label, help and error to the control', () => {
    const html = renderToStaticMarkup(<Field id="example" label="Example field" hint="Example help" error="Example error" required>
      {attributes => <Input {...attributes} name="example" />}
    </Field>);
    expect(html).toContain('for="example"');
    expect(html).toContain('aria-describedby="example-hint example-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('required=""');
    expect(html).toContain('role="alert"');
  });

  it('retains native labels and attributes on select, textarea and checkbox', () => {
    expect(renderToStaticMarkup(<Select aria-label="Example choice" defaultValue="one"><option value="one">One</option></Select>)).toContain('selected=""');
    expect(renderToStaticMarkup(<Textarea aria-label="Example notes" maxLength={200} />)).toContain('maxLength="200"');
    expect(renderToStaticMarkup(<Checkbox aria-label="Example option" defaultChecked />)).toContain('type="checkbox"');
  });
});
