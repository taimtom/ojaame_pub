import { useMemo } from 'react';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';

import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

import { normalizeChatMarkdown } from './ai-agent-markdown-utils';

// ----------------------------------------------------------------------

const StyledMarkdown = styled(ReactMarkdown)(({ theme }) => ({
  ...theme.typography.body2,
  lineHeight: 1.55,
  wordBreak: 'break-word',
  color: 'inherit',
  '& > *:first-of-type': { marginTop: 0 },
  '& > *:last-child': { marginBottom: 0 },
  '& p': {
    ...theme.typography.body2,
    lineHeight: 1.55,
    color: 'inherit',
    margin: 0,
    marginBottom: theme.spacing(1),
    '&:last-child': { marginBottom: 0 },
  },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    ...theme.typography.subtitle2,
    color: 'inherit',
    marginTop: theme.spacing(1.25),
    marginBottom: theme.spacing(0.5),
    fontWeight: 700,
    '&:first-of-type': { marginTop: 0 },
  },
  '& ul, & ol': {
    marginTop: theme.spacing(0.75),
    marginBottom: theme.spacing(0.75),
    paddingLeft: theme.spacing(2.25),
  },
  '& li': {
    ...theme.typography.body2,
    lineHeight: 1.55,
    color: 'inherit',
    marginTop: theme.spacing(0.25),
    marginBottom: theme.spacing(0.25),
  },
  '& li > p': { marginBottom: 0, display: 'inline' },
  '& strong': { fontWeight: 700 },
  '& em': { fontStyle: 'italic' },
  '& a': { color: theme.palette.primary.main },
  '& code': {
    ...theme.typography.caption,
    padding: theme.spacing(0.25, 0.5),
    borderRadius: theme.shape.borderRadius / 2,
    backgroundColor: theme.palette.action.hover,
  },
  '& pre': {
    ...theme.typography.caption,
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    overflow: 'auto',
    backgroundColor: theme.palette.background.neutral,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  '& hr': {
    marginTop: theme.spacing(1.25),
    marginBottom: theme.spacing(1.25),
    border: 0,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& blockquote': {
    margin: 0,
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    paddingLeft: theme.spacing(1.5),
    borderLeft: `3px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
  },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    ...theme.typography.caption,
  },
  '& th, & td': {
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(0.5, 1),
    textAlign: 'left',
  },
}));

export function AiAgentMarkdown({ children, sx }) {
  const content = useMemo(() => normalizeChatMarkdown(children), [children]);

  if (!content) return null;

  return (
    <StyledMarkdown
      children={content}
      remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
      components={{
        a: ({ href, children: linkChildren, ...other }) => (
          <Link href={href} target="_blank" rel="noopener noreferrer" {...other}>
            {linkChildren}
          </Link>
        ),
        strong: ({ children: strongChildren }) => <strong>{strongChildren}</strong>,
        em: ({ children: emChildren }) => <em>{emChildren}</em>,
      }}
      sx={sx}
    />
  );
}
