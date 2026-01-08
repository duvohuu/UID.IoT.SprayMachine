import React from 'react';
import { 
    Breadcrumbs, 
    Typography, 
    Link, 
    Box,
    Paper,
    useTheme,
    alpha
} from '@mui/material';
import { 
    Home as HomeIcon,
    NavigateNext as NavigateNextIcon,
    Settings as SettingsIcon,
    WaterDrop as SprayIcon, 
    PrecisionManufacturing as CNCIcon,
    Liquor as PowderIcon,
    Grain as SaltIcon,
    Dashboard as DashboardIcon
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

/**
 * ========================================
 * BREADCRUMB COMPONENT
 * ========================================
 * Hiển thị đường dẫn điều hướng
 */
const Breadcrumb = () => {
    const location = useLocation();
    const theme = useTheme();

    // Map routes to breadcrumb config
    const getBreadcrumbConfig = () => {
        // ✅ Normalize path: remove trailing slash
        const path = location.pathname.replace(/\/$/, '') || '/';

        // Status Page (Home)
        if (path === '/status' || path === '') {
            return [
                { label: 'IOT-Dashboard', icon: <DashboardIcon />, to: '/status' }, 
                { label: 'Home', icon: <HomeIcon />, active: true } 
            ];
        }

        // Setting Page
        if (path === '/setting') {
            return [
                { label: 'IOT-Dashboard', icon: <DashboardIcon />, to: '/status' }, 
                { label: 'Setting', icon: <SettingsIcon />, active: true } 
            ];
        }

        // Spray Machine Page
        if (path.startsWith('/spray/')) {
            const machineId = path.split('/')[2];
            return [
                { label: 'IOT-Dashboard', icon: <DashboardIcon />, to: '/status' },
                { label: 'Home', icon: <HomeIcon />, to: '/status' }, 
                { label: `Spray Machine (${machineId})`, icon: <SprayIcon />, active: true } 
            ];
        }

        // CNC Machine Page
        if (path.startsWith('/cnc/')) {
            const machineId = path.split('/')[2];
            return [
                { label: 'IOT-Dashboard', icon: <DashboardIcon />, to: '/status' },
                { label: 'Home', icon: <HomeIcon />, to: '/status' },
                { label: `CNC Machine (${machineId})`, icon: <CNCIcon />, active: true }
            ];
        }

        // Powder Filling Machine Page
        if (path.startsWith('/powder/')) {
            const machineId = path.split('/')[2];
            return [
                { label: 'IOT-Dashboard', icon: <DashboardIcon />, to: '/status' },
                { label: 'Home', icon: <HomeIcon />, to: '/status' },
                { label: `Powder Machine (${machineId})`, icon: <PowderIcon />, active: true }
            ];
        }

        // Salt Filling Machine Page
        if (path.startsWith('/salt/')) {
            const machineId = path.split('/')[2];
            return [
                { label: 'IOT-Dashboard', icon: <DashboardIcon />, to: '/status' },
                { label: 'Home', icon: <HomeIcon />, to: '/status' },
                { label: `Salt Machine (${machineId})`, icon: <SaltIcon />, active: true }
            ];
        }

        // Default
        return [
            { label: 'IOT-Dashboard', icon: <DashboardIcon />, to: '/status' }
        ];
    };

    const breadcrumbs = getBreadcrumbConfig();

    return (
        <Paper
            elevation={0}
            sx={{
                py: 1.5,
                px: 3,
                mb: 2,
                background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.1)} 0%, ${alpha(theme.palette.secondary.dark, 0.05)} 100%)`
                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                backdropFilter: 'blur(10px)',
            }}
        >
            <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
                aria-label="breadcrumb"
                sx={{
                    '& .MuiBreadcrumbs-separator': {
                        mx: 1
                    }
                }}
            >
                {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    if (isLast || crumb.active) {
                        return (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    color: 'primary.main',
                                    fontWeight: 600
                                }}
                            >
                                {crumb.icon && React.cloneElement(crumb.icon, { 
                                    sx: { fontSize: 18 } 
                                })}
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        fontWeight: 600,
                                        color: 'primary.main'
                                    }}
                                >
                                    {crumb.label}
                                </Typography>
                            </Box>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            component={RouterLink}
                            to={crumb.to}
                            underline="hover"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'text.secondary',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    color: 'primary.main',
                                    transform: 'translateX(2px)'
                                }
                            }}
                        >
                            {crumb.icon && React.cloneElement(crumb.icon, { 
                                sx: { fontSize: 18 } 
                            })}
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {crumb.label}
                            </Typography>
                        </Link>
                    );
                })}
            </Breadcrumbs>
        </Paper>
    );
};

export default Breadcrumb;