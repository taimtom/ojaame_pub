import { useEffect } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';

import { Image } from 'src/components/image';
import { Lightbox, useLightBox } from 'src/components/lightbox';
import {
  Carousel,
  useCarousel,
  CarouselThumb,
  CarouselThumbs,
  CarouselArrowNumberButtons,
} from 'src/components/carousel';

function imageEntrySrc(img) {
  if (img == null) return '';
  if (typeof img === 'string') return img;
  return img.path || '';
}

export function ProductDetailsCarousel({ coverUrl, images, productName }) {
  // Build slides array from coverUrl and images.
  const slides = [];
  if (coverUrl) {
    slides.push({
      src: coverUrl,
      id: 'cover',
      alt: 'Cover Image',
    });
  }
  if (images && images.length > 0) {
    images.forEach((img, index) => {
      const src = imageEntrySrc(img);
      if (!src) return;
      // Skip if this image duplicates the coverUrl.
      if (coverUrl && src === coverUrl) return;
      slides.push({
        src,
        id: src || index,
        alt: `Product image ${index + 1}`,
      });
    });
  }

  const carousel = useCarousel({ thumbs: { slidesToShow: 'auto' } });
  const lightbox = useLightBox(slides);

  useEffect(() => {
    if (lightbox.open) {
      carousel.mainApi?.scrollTo(lightbox.selected, true);
    }
  }, [carousel.mainApi, lightbox.open, lightbox.selected]);

  return (
    <>
      {slides.length > 0 ? (
        <>
          <Box sx={{ mb: 2.5, position: 'relative' }}>
            <CarouselArrowNumberButtons
              {...carousel.arrows}
              options={carousel.options}
              totalSlides={carousel.dots.dotCount}
              selectedIndex={carousel.dots.selectedIndex + 1}
              sx={{ right: 16, bottom: 16, position: 'absolute' }}
            />
            <Carousel carousel={carousel} sx={{ borderRadius: 2 }}>
              {slides.map((slide) => (
                <Image
                  key={slide.id}
                  alt={slide.alt}
                  src={slide.src}
                  ratio="1/1"
                  onClick={() => lightbox.onOpen(slide.src)}
                  sx={{ cursor: 'zoom-in', minWidth: 320 }}
                />
              ))}
            </Carousel>
          </Box>
          <CarouselThumbs
            ref={carousel.thumbs.thumbsRef}
            options={carousel.options?.thumbs}
            slotProps={{ disableMask: true }}
            sx={{ width: 360 }}
          >
            {slides.map((slide, index) => (
              <CarouselThumb
                key={slide.id}
                index={index}
                src={slide.src}
                selected={index === carousel.thumbs.selectedIndex}
                onClick={() => carousel.thumbs.onClickThumb(index)}
              />
            ))}
          </CarouselThumbs>
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 300,
          }}
        >
          <Avatar alt={productName || 'Product'} variant="rounded" sx={{ width: 64, height: 64 }}>
            {(productName || 'N/A').charAt(0)}
          </Avatar>
        </Box>
      )}

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
        onGetCurrentIndex={(index) => lightbox.setSelected(index)}
      />
    </>
  );
}
