import { useMemo } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import {
  getCtaDefaults,
  getFeatureDefaults,
  getHeroDefaults,
  getServiceDefaults,
  getTemplateSections,
  getTestimonialDefaults,
  getTrustMetricDefaults,
  setContentConfigValue,
  setListItemField,
  setListItemFieldDirect,
} from 'src/utils/store-website-content';

function ItemCard({ index, title, children }) {
  return (
    <Stack spacing={1.5} sx={{ p: 2, borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {title} {index + 1}
      </Typography>
      {children}
    </Stack>
  );
}

function SectionHeaderFields({ methods, sectionKey, defaults }) {
  const updateHeader = (field, value) => {
    setContentConfigValue(methods, (current) => ({
      ...current,
      [sectionKey]: {
        ...(current[sectionKey] || {}),
        [field]: value,
      },
    }));
  };

  return (
    <Stack spacing={2}>
      <Field.Text
        name={`content_config.${sectionKey}.title`}
        label="Section heading"
        placeholder={defaults.title}
        helperText="Leave blank to use template default"
        onChange={(e) => updateHeader('title', e.target.value)}
      />
      <Field.Text
        name={`content_config.${sectionKey}.subtitle`}
        label="Section subheading"
        placeholder={defaults.subtitle}
        helperText="Leave blank to use template default"
        onChange={(e) => updateHeader('subtitle', e.target.value)}
      />
    </Stack>
  );
}

function TrustMetricsEditor({ methods, templateId }) {
  const defaults = useMemo(() => getTrustMetricDefaults(templateId), [templateId]);

  return (
    <Stack spacing={2}>
      <Typography variant="caption" color="text.secondary">
        Leave a field blank to keep the template default for that stat.
      </Typography>
      {defaults.map((metric, index) => (
        <ItemCard key={index} index={index} title="Stat">
          <Field.Text
            name={`content_config.trustMetrics.${index}.icon`}
            label="Icon (emoji)"
            placeholder={metric.icon}
            onChange={(e) => setListItemFieldDirect(methods, 'trustMetrics', index, 'icon', e.target.value)}
          />
          <Field.Text
            name={`content_config.trustMetrics.${index}.value`}
            label="Value"
            placeholder={metric.value}
            onChange={(e) => setListItemFieldDirect(methods, 'trustMetrics', index, 'value', e.target.value)}
          />
          <Field.Text
            name={`content_config.trustMetrics.${index}.label`}
            label="Label"
            placeholder={metric.label}
            onChange={(e) => setListItemFieldDirect(methods, 'trustMetrics', index, 'label', e.target.value)}
          />
        </ItemCard>
      ))}
    </Stack>
  );
}

function ServiceItemsEditor({ methods, templateId }) {
  const defaults = useMemo(() => getServiceDefaults(templateId), [templateId]);

  return (
    <Stack spacing={2} divider={<Divider flexItem />}>
      <SectionHeaderFields methods={methods} sectionKey="services" defaults={defaults} />
      {defaults.items.map((item, index) => (
        <ItemCard key={index} index={index} title="Service">
          <Field.Text
            name={`content_config.services.items.${index}.icon`}
            label="Icon key"
            placeholder={item.icon}
            helperText="e.g. fire, leaf, truck, cake"
            onChange={(e) => setListItemField(methods, 'services', index, 'icon', e.target.value)}
          />
          <Field.Text
            name={`content_config.services.items.${index}.title`}
            label="Title"
            placeholder={item.title}
            onChange={(e) => setListItemField(methods, 'services', index, 'title', e.target.value)}
          />
          <Field.Text
            name={`content_config.services.items.${index}.desc`}
            label="Description"
            multiline
            rows={2}
            placeholder={item.desc}
            onChange={(e) => setListItemField(methods, 'services', index, 'desc', e.target.value)}
          />
        </ItemCard>
      ))}
    </Stack>
  );
}

function FeatureItemsEditor({ methods, templateId }) {
  const defaults = useMemo(() => getFeatureDefaults(templateId), [templateId]);
  if (!defaults.items.length) return null;

  return (
    <Stack spacing={2} divider={<Divider flexItem />}>
      <SectionHeaderFields methods={methods} sectionKey="features" defaults={defaults} />
      {defaults.items.map((item, index) => (
        <ItemCard key={index} index={index} title="Benefit">
          <Field.Text
            name={`content_config.features.items.${index}.icon`}
            label="Icon key"
            placeholder={item.icon}
            onChange={(e) => setListItemField(methods, 'features', index, 'icon', e.target.value)}
          />
          <Field.Text
            name={`content_config.features.items.${index}.title`}
            label="Title"
            placeholder={item.title}
            onChange={(e) => setListItemField(methods, 'features', index, 'title', e.target.value)}
          />
          <Field.Text
            name={`content_config.features.items.${index}.desc`}
            label="Description"
            multiline
            rows={2}
            placeholder={item.desc}
            onChange={(e) => setListItemField(methods, 'features', index, 'desc', e.target.value)}
          />
        </ItemCard>
      ))}
    </Stack>
  );
}

function TestimonialsEditor({ methods }) {
  const defaults = useMemo(() => getTestimonialDefaults(), []);

  const updateHeader = (field, value) => {
    setContentConfigValue(methods, (current) => ({
      ...current,
      testimonials: {
        ...(current.testimonials || {}),
        [field]: value,
      },
    }));
  };

  return (
    <Stack spacing={2} divider={<Divider flexItem />}>
      <Field.Text
        name="content_config.testimonials.title"
        label="Section heading"
        placeholder={defaults.title}
        onChange={(e) => updateHeader('title', e.target.value)}
      />
      <Field.Text
        name="content_config.testimonials.subtitle"
        label="Section subheading"
        placeholder={defaults.subtitle}
        onChange={(e) => updateHeader('subtitle', e.target.value)}
      />
      <Field.Text
        name="content_config.testimonials.ratingSummary"
        label="Rating summary"
        placeholder={defaults.ratingSummary}
        onChange={(e) => updateHeader('ratingSummary', e.target.value)}
      />
      {defaults.items.map((item, index) => (
        <ItemCard key={index} index={index} title="Review">
          <Field.Text
            name={`content_config.testimonials.items.${index}.name`}
            label="Customer name"
            placeholder={item.name}
            onChange={(e) => setListItemField(methods, 'testimonials', index, 'name', e.target.value)}
          />
          <Field.Text
            name={`content_config.testimonials.items.${index}.location`}
            label="Location"
            placeholder={item.location}
            onChange={(e) => setListItemField(methods, 'testimonials', index, 'location', e.target.value)}
          />
          <Field.Text
            name={`content_config.testimonials.items.${index}.avatar`}
            label="Avatar initials"
            placeholder={item.avatar}
            onChange={(e) => setListItemField(methods, 'testimonials', index, 'avatar', e.target.value)}
          />
          <Field.Text
            name={`content_config.testimonials.items.${index}.rating`}
            label="Star rating (1–5)"
            type="number"
            placeholder={String(item.rating)}
            onChange={(e) =>
              setListItemField(methods, 'testimonials', index, 'rating', Number(e.target.value) || '')
            }
          />
          <Field.Text
            name={`content_config.testimonials.items.${index}.text`}
            label="Review text"
            multiline
            rows={3}
            placeholder={item.text}
            onChange={(e) => setListItemField(methods, 'testimonials', index, 'text', e.target.value)}
          />
        </ItemCard>
      ))}
    </Stack>
  );
}

function CtaEditor({ methods, templateId, storeName }) {
  const defaults = useMemo(() => getCtaDefaults(templateId, storeName), [templateId, storeName]);

  const updateCta = (field, value) => {
    setContentConfigValue(methods, (current) => ({
      ...current,
      cta: {
        ...(current.cta || {}),
        [field]: value,
      },
    }));
  };

  return (
    <Stack spacing={2}>
      <Field.Text
        name="content_config.cta.eyebrow"
        label="Eyebrow text"
        placeholder={defaults.eyebrow}
        onChange={(e) => updateCta('eyebrow', e.target.value)}
      />
      <Field.Text
        name="content_config.cta.title"
        label="Heading"
        placeholder={defaults.title}
        onChange={(e) => updateCta('title', e.target.value)}
      />
      <Field.Text
        name="content_config.cta.subtitle"
        label="Subheading"
        multiline
        rows={2}
        placeholder={defaults.subtitle}
        onChange={(e) => updateCta('subtitle', e.target.value)}
      />
      <Field.Text
        name="content_config.cta.primaryCta"
        label="Primary button"
        placeholder={defaults.primaryCta}
        onChange={(e) => updateCta('primaryCta', e.target.value)}
      />
      <Field.Text
        name="content_config.cta.secondaryCta"
        label="Secondary button"
        placeholder={defaults.secondaryCta}
        onChange={(e) => updateCta('secondaryCta', e.target.value)}
      />
    </Stack>
  );
}

function FeaturedEditor({ methods }) {
  const updateFeatured = (field, value) => {
    setContentConfigValue(methods, (current) => ({
      ...current,
      featured: {
        ...(current.featured || {}),
        [field]: value,
      },
    }));
  };

  return (
    <Field.Text
      name="content_config.featured.title"
      label="Section heading"
      placeholder="Featured Products"
      helperText="Leave blank to use template default"
      onChange={(e) => updateFeatured('title', e.target.value)}
    />
  );
}

export function StoreWebsiteContentEditors({ methods, templateId, storeName }) {
  const sections = useMemo(() => getTemplateSections(templateId), [templateId]);
  const heroDefaults = useMemo(() => getHeroDefaults(templateId), [templateId]);

  const updateHero = (field, value) => {
    setContentConfigValue(methods, (current) => ({
      ...current,
      hero: {
        ...(current.hero || {}),
        [field]: value,
      },
    }));
  };

  return (
    <>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Typography variant="subtitle1">Hero section</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Field.Text
              name="content_config.hero.title"
              label="Heading"
              placeholder={heroDefaults.title || 'Welcome to our store'}
              helperText="Leave blank to use template default"
              onChange={(e) => updateHero('title', e.target.value)}
            />
            <Field.Text
              name="content_config.hero.subtitle"
              label="Subtitle"
              multiline
              rows={2}
              placeholder={heroDefaults.subtitle}
              onChange={(e) => updateHero('subtitle', e.target.value)}
            />
            <Field.Text
              name="content_config.hero.badge"
              label="Badge / trust line"
              placeholder={heroDefaults.badge || heroDefaults.trustBadge}
              helperText="e.g. Trusted by 1,200+ clients or New arrivals · 2026"
              onChange={(e) => updateHero('badge', e.target.value)}
            />
            <Field.Text
              name="content_config.hero.ctaLabel"
              label="Primary button"
              placeholder={heroDefaults.ctaLabel || 'Shop now'}
              onChange={(e) => updateHero('ctaLabel', e.target.value)}
            />
            <Field.Text
              name="content_config.hero.secondaryCtaLabel"
              label="Secondary button"
              placeholder="View cart"
              onChange={(e) => updateHero('secondaryCtaLabel', e.target.value)}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {sections.includes('trust') && (
        <Accordion>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Typography variant="subtitle1">Trust stats</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TrustMetricsEditor methods={methods} templateId={templateId} />
          </AccordionDetails>
        </Accordion>
      )}

      {sections.includes('services') && (
        <Accordion>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Typography variant="subtitle1">Services / offerings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ServiceItemsEditor methods={methods} templateId={templateId} />
          </AccordionDetails>
        </Accordion>
      )}

      {sections.includes('features') && (
        <Accordion>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Typography variant="subtitle1">Why choose us</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FeatureItemsEditor methods={methods} templateId={templateId} />
          </AccordionDetails>
        </Accordion>
      )}

      {sections.includes('featured') && (
        <Accordion>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Typography variant="subtitle1">Featured products</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FeaturedEditor methods={methods} />
          </AccordionDetails>
        </Accordion>
      )}

      {sections.includes('testimonials') && (
        <Accordion>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Typography variant="subtitle1">Testimonials</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TestimonialsEditor methods={methods} />
          </AccordionDetails>
        </Accordion>
      )}

      {sections.includes('cta') && (
        <Accordion>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Typography variant="subtitle1">Bottom call to action</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <CtaEditor methods={methods} templateId={templateId} storeName={storeName} />
          </AccordionDetails>
        </Accordion>
      )}

      <Accordion>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Typography variant="subtitle1">About section</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Field.Text
              name="content_config.about.title"
              label="Title"
              placeholder="About us"
              onChange={(e) => {
                setContentConfigValue(methods, (current) => ({
                  ...current,
                  about: { ...(current.about || {}), title: e.target.value },
                }));
              }}
            />
            <Field.Text
              name="content_config.about.body"
              label="Body text"
              multiline
              rows={4}
              placeholder="Tell your story..."
              onChange={(e) => {
                setContentConfigValue(methods, (current) => ({
                  ...current,
                  about: { ...(current.about || {}), body: e.target.value },
                }));
              }}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Typography variant="subtitle1">Contact section</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Field.Text
              name="content_config.contact.title"
              label="Section title"
              placeholder="Visit or contact us"
              onChange={(e) => {
                setContentConfigValue(methods, (current) => ({
                  ...current,
                  contact: { ...(current.contact || {}), title: e.target.value },
                }));
              }}
            />
            <Field.Text
              name="content_config.contact.address"
              label="Address"
              multiline
              rows={2}
              onChange={(e) => {
                setContentConfigValue(methods, (current) => ({
                  ...current,
                  contact: { ...(current.contact || {}), address: e.target.value },
                }));
              }}
            />
            <Field.Text
              name="content_config.contact.phoneNumber"
              label="Phone number"
              onChange={(e) => {
                setContentConfigValue(methods, (current) => ({
                  ...current,
                  contact: { ...(current.contact || {}), phoneNumber: e.target.value },
                }));
              }}
            />
            <Field.Text
              name="content_config.contact.email"
              label="Email"
              type="email"
              onChange={(e) => {
                setContentConfigValue(methods, (current) => ({
                  ...current,
                  contact: { ...(current.contact || {}), email: e.target.value },
                }));
              }}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Typography variant="subtitle1">Footer</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Field.Text
            name="content_config.footer.copyrightText"
            label="Copyright text"
            placeholder="© Your Store. All rights reserved."
            onChange={(e) => {
              setContentConfigValue(methods, (current) => ({
                ...current,
                footer: { ...(current.footer || {}), copyrightText: e.target.value },
              }));
            }}
          />
        </AccordionDetails>
      </Accordion>
    </>
  );
}
