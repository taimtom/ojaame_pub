import Autoplay from 'embla-carousel-autoplay';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { varAlpha } from 'src/theme/styles';
import { fCurrency } from 'src/utils/format-number';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import {
  Carousel,
  useCarousel,
  CarouselDotButtons,
  CarouselArrowBasicButtons,
} from 'src/components/carousel';

// ----------------------------------------------------------------------

export function AppFeatured({ list, loading, sx, ...other }) {
  const carousel = useCarousel({ loop: true }, [Autoplay({ playOnInit: true, delay: 8000 })]);

  if (loading) {
    return (
      <Card sx={{ bgcolor: 'common.black', ...sx }} {...other}>
        <Skeleton variant="rectangular" width="100%" height={{ xs: 288, xl: 320 }} />
      </Card>
    );
  }

  if (!list || list.length === 0) {
    return (
      <Card
        sx={{
          bgcolor: 'common.black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: { xs: 288, xl: 320 },
          ...sx,
        }}
        {...other}
      >
        <Box sx={{ textAlign: 'center', color: 'common.white', opacity: 0.5, p: 3 }}>
          <Iconify icon="solar:box-bold-duotone" width={48} sx={{ mb: 1 }} />
          <Typography variant="body2">Add products to your store to see them here</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ bgcolor: 'common.black', ...sx }} {...other}>
      <CarouselDotButtons
        scrollSnaps={carousel.dots.scrollSnaps}
        selectedIndex={carousel.dots.selectedIndex}
        onClickDot={carousel.dots.onClickDot}
        sx={{ top: 16, left: 16, position: 'absolute', color: 'primary.light' }}
      />

      <CarouselArrowBasicButtons
        {...carousel.arrows}
        options={carousel.options}
        sx={{ top: 8, right: 8, position: 'absolute', color: 'common.white' }}
      />

      <Carousel carousel={carousel}>
        {list.map((item) => (
          <CarouselItem key={item.id} item={item} />
        ))}
      </Carousel>
    </Card>
  );
}

// ----------------------------------------------------------------------

function CarouselItem({ item, ...other }) {
  const hasCover = Boolean(item.coverUrl);

  return (
    <Box sx={{ width: 1, position: 'relative', ...other }}>
      {/* Text overlay */}
      <Box
        sx={{
          p: 3,
          gap: 1,
          width: 1,
          bottom: 0,
          zIndex: 9,
          display: 'flex',
          position: 'absolute',
          color: 'common.white',
          flexDirection: 'column',
        }}
      >
        <Typography variant="overline" sx={{ color: 'primary.light' }}>
          {item.total_qty > 0 ? `Top Seller · ${item.total_qty} sold` : 'Featured Product'}
        </Typography>

        <Typography color="inherit" variant="h5" noWrap>
          {item.title}
        </Typography>

        <Typography variant="body2" noWrap sx={{ opacity: 0.72 }}>
          {item.total_revenue > 0
            ? `${fCurrency(item.total_revenue)} revenue this year`
            : item.description}
        </Typography>
      </Box>

      {hasCover ? (
        <Image
          alt={item.title}
          src={item.coverUrl}
          slotProps={{
            overlay: {
              background: (theme) =>
                `linear-gradient(to bottom, ${varAlpha(theme.vars.palette.common.blackChannel, 0)} 0%, ${theme.vars.palette.common.black} 75%)`,
            },
          }}
          sx={{ width: 1, height: { xs: 288, xl: 320 } }}
        />
      ) : (
        <Box
          sx={{
            width: 1,
            height: { xs: 288, xl: 320 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.900',
          }}
        >
          <Iconify icon="solar:box-bold-duotone" width={80} sx={{ color: 'grey.700' }} />
        </Box>
      )}
    </Box>
  );
}
