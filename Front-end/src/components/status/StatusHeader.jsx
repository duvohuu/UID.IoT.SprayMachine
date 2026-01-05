import React from 'react';
import { Box, Typography, Alert, Fade, Chip } from '@mui/material';
import { useTheme, styled, alpha } from '@mui/material/styles';
import { 
    MonitorHeart as StatusIcon,
    AdminPanelSettings as AdminIcon,
    Person as UserIcon,
    Link as PartnershipIcon 
} from '@mui/icons-material';

const nohieLeatherLogo = '/Ngoc_Hiep.png';
const ssbLogo = '/SSB_Logo.png';

const LogoContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(3),
    marginBottom: theme.spacing(3),
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: 'translateX(15px)',
    [theme.breakpoints.down('sm')]: {
        gap: theme.spacing(2),
        marginBottom: theme.spacing(2),
    }
}));

const PartnershipBadge = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.primary.main,
    transition: "all 0.3s ease",
    position: 'relative',
    "&::before": {
        content: '""',
        position: 'absolute',
        inset: -8,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        zIndex: -1,
    },
    "&:hover": {
        transform: 'scale(1.2) rotate(-45deg)',
        color: theme.palette.secondary.main,
        filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.4)})`,
        "&::before": {
            opacity: 1,
        }
    },
}));

const StatusHeader = ({ isMobile, error, user }) => {
    const theme = useTheme();
    const isAdmin = user?.role === 'admin';

    return (
        <Box sx={{ mb: 4 }}>
            <Fade in={true} timeout={800}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Fade in={true} timeout={600}>
                        <LogoContainer>
                            {/* Nohie Leather Logo */}
                            <Box
                                component="img"
                                src={nohieLeatherLogo}
                                alt="Nohie Leather"
                                sx={{
                                    height: { xs: 60, sm: 75, md: 85 }, 
                                    width: 'auto',
                                    objectFit: 'contain',
                                    marginRight: { xs: 0.5, sm: 0.75 }, 
                                    filter: theme.palette.mode === 'dark'
                                        ? "brightness(0.95) drop-shadow(0 4px 16px rgba(255,255,255,0.15))"
                                        : "drop-shadow(0 4px 16px rgba(0,0,0,0.12))",
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                        filter: theme.palette.mode === 'dark'
                                            ? "brightness(1.05) drop-shadow(0 6px 24px rgba(255,255,255,0.2))"
                                            : "drop-shadow(0 6px 24px rgba(0,0,0,0.18)) brightness(1.05)",
                                        transform: "translateY(-3px) scale(1.05)"
                                    }
                                }}
                            />

                            <PartnershipBadge>
                                <PartnershipIcon 
                                    sx={{ 
                                        fontSize: { xs: 28, sm: 32, md: 36 },
                                        transform: 'rotate(-45deg)', 
                                    }} 
                                />
                            </PartnershipBadge>

                            {/* SSB Logo */}
                            <Box
                                component="img"
                                src={ssbLogo}
                                alt="SSB"
                                sx={{
                                    height: { xs: 42, sm: 52, md: 58 },
                                    width: 'auto',
                                    objectFit: 'contain',
                                    marginLeft: { xs: -0.5, sm: -0.5 }, 
                                    filter: theme.palette.mode === 'dark'
                                        ? "brightness(0.95) drop-shadow(0 4px 14px rgba(255,255,255,0.12))"
                                        : "drop-shadow(0 4px 14px rgba(0,0,0,0.1))",
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    "&:hover": {
                                        filter: theme.palette.mode === 'dark'
                                            ? "brightness(1.05) drop-shadow(0 6px 20px rgba(255,255,255,0.18))"
                                            : "drop-shadow(0 6px 20px rgba(0,0,0,0.15)) brightness(1.05)",
                                        transform: "translateY(-3px) scale(1.05)"
                                    }
                                }}
                            />
                        </LogoContainer>
                    </Fade>

                    {/* Header với icon */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: 2,
                        mb: 2
                    }}>
                        <Typography 
                            variant={isMobile ? "h4" : "h3"} 
                            component="h1"
                            sx={{ 
                                fontWeight: 700,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '0.5px',
                            }}
                        >
                            {isAdmin ? 'Quản Lý Hệ Thống' : 'Trạng Thái Máy Móc'}
                        </Typography>
                    </Box>

                    {/* User Role và Welcome Message */}
                    {user && (
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                                icon={isAdmin ? <AdminIcon /> : <UserIcon />}
                                label={isAdmin ? `Admin: ${user.username}` : `User: ${user.username}`}
                                color={isAdmin ? 'secondary' : 'primary'}
                                variant="filled"
                                sx={{ fontWeight: 600 }}
                            />
                        </Box>
                    )}
                    
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            color: theme.palette.text.secondary,
                            mx: 'auto',
                            lineHeight: 1.6,
                            fontWeight: 500,
                        }}
                    >
                        {isAdmin 
                            ? 'Giám sát và quản lý tất cả thiết bị trong hệ thống. Thêm, sửa, xóa máy móc và phân quyền user.'
                            : 'Giám sát và theo dõi trạng thái các máy móc được phân quyền cho bạn.'
                        }
                    </Typography>
                </Box>
            </Fade>

            {error && (
                <Fade in={true} timeout={1000}>
                    <Alert 
                        severity={user?.role === 'admin' ? "info" : "warning"}
                        sx={{ 
                            mb: 3,
                            borderRadius: 2,
                            '& .MuiAlert-message': {
                                width: '100%'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                </Fade>
            )}
        </Box>
    );
};

export default StatusHeader;