import { defineConfig, type Template, type TinaField } from 'tinacms'

const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main'

/** A picture, animated image or video, plus its alt text. */
const mediaFields = (folder: (values: Record<string, any>) => string): TinaField[] => [
  {
    name: 'src',
    label: 'Image or video',
    type: 'image',
    accept: ['image', 'video'],
    uploadDir: folder,
    description: 'Images (JPG, PNG, WebP, GIF, SVG) or videos (MP4, WebM). Videos autoplay muted and loop.',
  },
  {
    name: 'alt',
    label: 'Description (for screen readers)',
    type: 'string',
  },
  {
    name: 'mp4Fallback',
    label: 'MP4 version (only needed for WebM videos)',
    type: 'image',
    accept: ['mp4'],
    uploadDir: folder,
  },
  {
    name: 'caption',
    label: 'Text on top of this media (optional)',
    type: 'object',
    fields: [
      { name: 'title', label: 'Title', type: 'string' },
      { name: 'lines', label: 'Lines below the title', type: 'string', ui: { component: 'textarea' } },
      {
        name: 'position',
        label: 'Position',
        type: 'string',
        options: [
          { value: 'top', label: 'Top' },
          { value: 'middle', label: 'Middle' },
          { value: 'above', label: 'Separate text box above the media' },
          { value: 'below', label: 'Separate text box below the media' },
        ],
      },
      {
        name: 'tone',
        label: 'Text colour',
        type: 'string',
        options: [
          { value: 'light', label: 'Light (for dark images)' },
          { value: 'dark', label: 'Dark (for light images)' },
        ],
      },
      { name: 'background', label: 'Text box background colour (for separate boxes, e.g. #e9e9e9)', type: 'string' },
    ],
  },
]

const caseStudyFolder = (values: Record<string, any>) =>
  values?._sys?.filename ? `media/${values._sys.filename}` : 'media'

const mediaObject = (name: string, label: string): TinaField => ({
  name,
  label,
  type: 'object',
  fields: mediaFields(caseStudyFolder),
})

const textFields: TinaField[] = [
  { name: 'title', label: 'Title', type: 'string', required: true },
  { name: 'subtitle', label: 'Subtitle', type: 'string', required: true },
  { name: 'copy', label: 'Text', type: 'string', required: true, ui: { component: 'textarea' } },
]

const blockTemplates: Template[] = [
  {
    name: 'oneImage',
    label: 'Full-width media',
    ui: { itemProps: (item) => ({ label: `▣ ${item?.image?.src?.split('/').pop() ?? 'Full-width media'}` }) },
    fields: [mediaObject('image', 'Media')],
  },
  {
    name: 'twoImages',
    label: 'Two media side by side',
    ui: { itemProps: () => ({ label: '▣▣ Two media side by side' }) },
    fields: [
      {
        name: 'images',
        label: 'Media (left, then right)',
        type: 'object',
        list: true,
        ui: { itemProps: (item) => ({ label: item?.src?.split('/').pop() ?? 'Media' }) },
        fields: mediaFields(caseStudyFolder),
      },
    ],
  },
  {
    name: 'imageTextLeft',
    label: 'Text left + media',
    ui: { itemProps: (item) => ({ label: `¶▣ ${item?.title ?? 'Text left + media'}` }) },
    fields: [mediaObject('image', 'Media'), ...textFields],
  },
  {
    name: 'imageTextRight',
    label: 'Media + text right',
    ui: { itemProps: (item) => ({ label: `▣¶ ${item?.title ?? 'Media + text right'}` }) },
    fields: [mediaObject('image', 'Media'), ...textFields],
  },
  {
    name: 'twoText',
    label: 'Two text columns',
    ui: { itemProps: (item) => ({ label: `¶¶ ${(item?.leftText ?? 'Two text columns').slice(0, 40)}` }) },
    fields: [
      { name: 'leftText', label: 'Left text', type: 'string', required: true, ui: { component: 'textarea' } },
      { name: 'rightText', label: 'Right text', type: 'string', ui: { component: 'textarea' } },
    ],
  },
]

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'media',
      publicFolder: 'public',
    },
    accept: ['image', 'video'],
  },
  schema: {
    collections: [
      {
        name: 'caseStudy',
        label: 'Case studies',
        path: 'content/case-studies',
        format: 'json',
        ui: {
          router: ({ document }) => `/${document._sys.filename}`,
          filename: {
            description: 'Used in the web address, e.g. "cupra" → rizzovanwyk.com/cupra',
            slugify: (values) =>
              String(values?.title || 'new-case-study')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
          },
        },
        fields: [
          { name: 'title', label: 'Title', type: 'string', isTitle: true, required: true },
          { name: 'category', label: 'Category', type: 'string', required: true },
          {
            name: 'draft',
            label: 'Hidden (draft)',
            type: 'boolean',
            description: 'Turn on to hide this case study from the live site.',
          },
          {
            name: 'navigationLogo',
            label: 'Logo in the project list',
            type: 'image',
            accept: ['image'],
            uploadDir: caseStudyFolder,
          },
          mediaObject('heroImage', 'Header media'),
          {
            name: 'intro',
            label: 'Intro',
            type: 'object',
            fields: [
              ...textFields,
              { name: 'year', label: 'Year (shown after the title)', type: 'string' },
              { name: 'services', label: 'Services (bottom of the first box)', type: 'string', list: true },
            ],
          },
          {
            name: 'blocks',
            label: 'Panels',
            type: 'object',
            list: true,
            templates: blockTemplates,
          },
          {
            name: 'credits',
            label: 'Credits',
            type: 'object',
            list: true,
            ui: { itemProps: (item) => ({ label: item?.name ?? 'Credit' }) },
            fields: [
              { name: 'name', label: 'Heading', type: 'string', required: true },
              { name: 'roles', label: 'Lines', type: 'string', list: true },
            ],
          },
        ],
      },
      {
        name: 'site',
        label: 'Site: order & About page',
        path: 'content/site',
        format: 'json',
        ui: {
          allowedActions: { create: false, delete: false },
          router: () => '/about',
        },
        fields: [
          {
            name: 'caseStudyOrder',
            label: 'Case study order',
            description:
              'Drag to reorder the project list. New case studies appear at the end until you add them here.',
            type: 'object',
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.caseStudy?.split('/').pop()?.replace('.json', '') ?? 'Case study',
              }),
            },
            fields: [
              { name: 'caseStudy', label: 'Case study', type: 'reference', collections: ['caseStudy'] },
            ],
          },
          {
            name: 'about',
            label: 'About page',
            type: 'object',
            fields: [
              {
                name: 'portraits',
                label: 'Portrait image',
                type: 'object',
                fields: mediaFields(() => 'media/about'),
              },
              { name: 'navImage', label: 'About button image', type: 'image', uploadDir: () => 'media/about' },
              { name: 'navTagline', label: 'About button tagline', type: 'string' },
              { name: 'statementLine1', label: 'Statement line 1', type: 'string' },
              { name: 'statementLine2', label: 'Statement line 2 (bold)', type: 'string' },
              { name: 'aboutTitle', label: 'About heading', type: 'string' },
              {
                name: 'aboutParagraphs',
                label: 'About paragraphs',
                type: 'string',
                list: true,
                ui: { component: 'textarea' } as any,
              },
              { name: 'servicesTitle', label: 'Services heading', type: 'string' },
              { name: 'services', label: 'Services', type: 'string', list: true },
            ],
          },
        ],
      },
    ],
  },
})
