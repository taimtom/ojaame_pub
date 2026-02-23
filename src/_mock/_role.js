import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const ROLE_DETAILS_TABS = [
  { label: 'Role content', value: 'content' },
  { label: 'Candidates', value: 'candidates' },
];

export const ROLE_SKILL_OPTIONS = [
  'UI',
  'UX',
  'Html',
  'JavaScript',
  'TypeScript',
  'Communication',
  'Problem Solving',
  'Leadership',
  'Time Management',
  'Adaptability',
  'Collaboration',
  'Creativity',
  'Critical Thinking',
  'Technical Skills',
  'Customer Service',
  'Project Management',
  'Problem Diagnosis',
];

export const ROLE_WORKING_SCHEDULE_OPTIONS = [
  'Monday to Friday',
  'Weekend availability',
  'Day shift',
];

export const ROLE_EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Full-time', value: 'Full-time' },
  { label: 'Part-time', value: 'Part-time' },
  { label: 'On demand', value: 'On demand' },
  { label: 'Negotiable', value: 'Negotiable' },
];

export const ROLE_EXPERIENCE_OPTIONS = [
  { label: 'No experience', value: 'No experience' },
  { label: '1 year exp', value: '1 year exp' },
  { label: '2 year exp', value: '2 year exp' },
  { label: '> 3 year exp', value: '> 3 year exp' },
];

export const ROLE_BENEFIT_OPTIONS = [
  { label: 'Free parking', value: 'Free parking' },
  { label: 'Bonus commission', value: 'Bonus commission' },
  { label: 'Travel', value: 'Travel' },
  { label: 'Device support', value: 'Device support' },
  { label: 'Health care', value: 'Health care' },
  { label: 'Training', value: 'Training' },
  { label: 'Health insurance', value: 'Health insurance' },
  { label: 'Retirement plans', value: 'Retirement plans' },
  { label: 'Paid time off', value: 'Paid time off' },
  { label: 'Flexible work schedule', value: 'Flexible work schedule' },
];

export const ROLE_PUBLISH_OPTIONS = [
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
];

export const ROLE_SORT_OPTIONS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Popular', value: 'popular' },
  { label: 'Oldest', value: 'oldest' },
];

const CANDIDATES = [...Array(12)].map((_, index) => ({
  id: _mock.id(index),
  position: _mock.position(index),
  name: _mock.fullName(index),
  avatarUrl: _mock.image.avatar(index),
}));

const CONTENT = `
<h6>Role description</h6>

<p>Occaecati est et illo quibusdam accusamus qui. Incidunt aut et molestiae ut facere aut. Est quidem iusto praesentium excepturi harum nihil tenetur facilis. Ut omnis voluptates nihil accusantium doloribus eaque debitis.</p>

<h6>Key responsibilities</h6>

<ul>
  <li>Working with agency for design drawing detail, quotation and local production.</li>
  <li>Produce window displays, signs, interior displays, floor plans and special promotions displays.</li>
  <li>Change displays to promote new product launches and reflect festive or seasonal themes.</li>
  <li>Planning and executing the open/renovation/ closing store procedure.</li>
  <li>Follow‐up store maintenance procedure and keep updating SKU In &amp; Out.</li>
  <li>Monitor costs and work within budget.</li>
  <li>Liaise with suppliers and source elements.</li>
</ul>

<h6>Why You'll love working here</h6>

<ul>
  <li>Working with agency for design drawing detail, quotation and local production.</li>
  <li>Produce window displays, signs, interior displays, floor plans and special promotions displays.</li>
  <li>Change displays to promote new product launches and reflect festive or seasonal themes.</li>
  <li>Planning and executing the open/renovation/ closing store procedure.</li>
  <li>Follow‐up store maintenance procedure and keep updating SKU In &amp; Out.</li>
  <li>Monitor costs and work within budget.</li>
  <li>Liaise with suppliers and source elements.</li>
</ul>
`;

export const _roles = [...Array(12)].map((_, index) => {
  const publish = index % 3 ? 'published' : 'draft';

  const salary = {
    type: (index % 5 && 'Custom') || 'Hourly',
    price: _mock.number.price(index),
    negotiable: _mock.boolean(index),
  };

  const benefits = ROLE_BENEFIT_OPTIONS.slice(0, 3).map((option) => option.label);

  const experience =
    ROLE_EXPERIENCE_OPTIONS.map((option) => option.label)[index] || ROLE_EXPERIENCE_OPTIONS[1].label;

  const employmentTypes = (index % 2 && ['Part-time']) ||
    (index % 3 && ['On demand']) ||
    (index % 4 && ['Negotiable']) || ['Full-time'];

  const company = {
    name: _mock.companyNames(index),
    logo: _mock.image.company(index),
    phoneNumber: _mock.phoneNumber(index),
    fullAddress: _mock.fullAddress(index),
  };

  return {
    id: _mock.id(index),
    salary,
    publish,
    company,
    benefits,
    experience,
    employmentTypes,
    content: CONTENT,
    candidates: CANDIDATES,
    position: _mock.position(index),
    title: _mock.roleTitle(index),
    createdAt: _mock.time(index),
    expiredDate: _mock.time(index),
    skills: ROLE_SKILL_OPTIONS.slice(0, 3),
    totalViews: _mock.number.nativeL(index),
    locations: [_mock.countryNames(1), _mock.countryNames(2)],
    workingSchedule: ROLE_WORKING_SCHEDULE_OPTIONS.slice(0, 2),
  };
});
