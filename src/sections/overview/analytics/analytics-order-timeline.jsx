import React from 'react';
import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fDateTime } from 'src/utils/format-time';

/**
 * AnalyticsOrderTimeline Component
 * Renders an order timeline with custom colored dots and connectors
 */
export function AnalyticsOrderTimeline({ title, subheader, list, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Timeline
        sx={{
          m: 0,
          p: 3,
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }}
      >
        {list.map((item, index) => (
          <TimelineItem key={item.id}>
            <ItemDot item={item} isLast={index === list.length - 1} />
          </TimelineItem>
        ))}
      </Timeline>
    </Card>
  );
}

AnalyticsOrderTimeline.propTypes = {
  title: PropTypes.string.isRequired,
  subheader: PropTypes.string,
  list: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      time: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      color: PropTypes.oneOf([
        'primary',
        'secondary',
        'success',
        'info',
        'warning',
        'error',
        'grey',
      ]),
    })
  ).isRequired,
};

/**
 * ItemDot Component
 * Handles rendering of the colored dot and connector
 */
function ItemDot({ item, isLast }) {
  const theme = useTheme();

  // Determine dot style based on color prop
  const getDotStyles = (colorKey) => {
    if (['primary', 'secondary', 'success', 'info', 'warning', 'error'].includes(colorKey)) {
      return {
        bg: theme.palette[colorKey].main,
        txt: theme.palette[colorKey].contrastText,
      };
    }
    // Fallback to grey
    return {
      bg: theme.palette.grey[500],
      txt: theme.palette.getContrastText(theme.palette.grey[500]),
    };
  };

  const { bg, txt } = getDotStyles(item.color);

  return (
    <>
      <TimelineSeparator>
        <TimelineDot
          sx={{
            bgcolor: bg,
            color: txt,
          }}
        />
        {!isLast && <TimelineConnector />}
      </TimelineSeparator>
      <TimelineContent>
        <Typography variant="subtitle2">{item.title}</Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {fDateTime(item.time)}
        </Typography>
      </TimelineContent>
    </>
  );
}

ItemDot.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    time: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    color: PropTypes.string,
  }).isRequired,
  isLast: PropTypes.bool.isRequired,
};
