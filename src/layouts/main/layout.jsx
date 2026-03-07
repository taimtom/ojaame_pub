import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePathname } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { Main } from './main';
import { NavMobile } from './nav/mobile';
import { NavDesktop } from './nav/desktop';
import { Footer, HomeFooter } from './footer';
import { HeaderBase } from '../core/header-base';
import { LayoutSection } from '../core/layout-section';
import { navData as mainNavData } from '../config-nav-main';

// ----------------------------------------------------------------------

export function MainLayout({ sx, data, children }) {
  const theme = useTheme();

  const pathname = usePathname();

  const mobileNavOpen = useBoolean();

  const homePage = pathname === '/';

  const layoutQuery = 'md';

  const navData = data?.nav ?? mainNavData;

  return (
    <>
      <NavMobile data={navData} open={mobileNavOpen.value} onClose={mobileNavOpen.onFalse} />

      <LayoutSection
        headerSection={
          <HeaderBase
            layoutQuery={layoutQuery}
            onOpenNav={mobileNavOpen.onTrue}
            slotsDisplay={{
              account: false,
              helpLink: false,
              contacts: false,
              searchbar: false,
              workspaces: false,
              localization: false,
              notifications: false,
              settings: false,
              purchase: false,
            }}
            slots={{
              rightAreaStart: (
                <NavDesktop
                  data={navData}
                  sx={{
                    display: 'none',
                    [theme.breakpoints.up(layoutQuery)]: {
                      mr: 2.5,
                      display: 'flex',
                    },
                  }}
                />
              ),
              rightAreaEnd: (
                <Button
                  component={RouterLink}
                  href={paths.auth.jwt.signUp}
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{
                    display: 'none',
                    ml: 2,
                    [theme.breakpoints.up(layoutQuery)]: { display: 'inline-flex' },
                  }}
                >
                  Get Started
                </Button>
              ),
            }}
          />
        }
        footerSection={homePage ? <HomeFooter /> : <Footer layoutQuery={layoutQuery} />}
        sx={sx}
      >
        <Main>{children}</Main>
      </LayoutSection>
    </>
  );
}
