import React, { useState } from "react";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    InputBase,
    Box,
    useTheme,
    Avatar,
    Fade,
    Grow,
} from "@mui/material";
import CustomMenuIcon from "../icons/CustomMenuIcon";
import SearchIcon from "@mui/icons-material/Search";
import { styled, alpha } from "@mui/material/styles";
import LoginDialog from "../header/LoginDialog";
import AvatarMenu from "../header/AvatarMenu";
import NotificationBell from "../header/NotificationBell"
import useAuth from "../../hooks/useAuth";
import { useSocket } from "../../context/SocketContext";
import { API_URL } from '../../config/apiConfig.js';


const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: 25,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
    backdropFilter: "blur(10px)",
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        transform: "translateY(-1px)",
        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
    },
    "&:focus-within": {
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
        border: `1px solid ${theme.palette.primary.main}`,
        transform: "translateY(-2px)",
        boxShadow: `0 12px 35px ${alpha(theme.palette.primary.main, 0.25)}`,
    },
    marginLeft: theme.spacing(2),
    width: "100%",
    maxWidth: 320,
    minWidth: 250,
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.primary.main,
    transition: "all 0.2s ease",
    zIndex: 1,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: theme.palette.text.primary,
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    width: "100%",
    fontSize: "0.875rem",
    fontWeight: 500,
    "& .MuiInputBase-input": {
        "&::placeholder": {
            color: alpha(theme.palette.text.primary, 0.6),
            opacity: 1,
        },
    },
}));

const StyledMenuButton = styled(IconButton)(({ theme }) => ({
    marginLeft: theme.spacing(2),
    padding: theme.spacing(1),
    borderRadius: 12,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        transform: "translateY(-1px) scale(1.05)",
        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    "& .MuiSvgIcon-root": {
        transition: "all 0.2s ease",
        color: theme.palette.primary.main,
        fontSize: '2rem', 
        width: '2.5rem',    
        height: '1.5rem', 
    },
    "&:hover .MuiSvgIcon-root": {
        transform: "rotate(90deg)",
    },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    cursor: "pointer",
    width: 42,
    height: 42,
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    "&::before": {
        content: '""',
        position: "absolute",
        top: -3,
        left: -3,
        right: -3,
        bottom: -3,
        borderRadius: "50%",
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        opacity: 0,
        transition: "opacity 0.3s ease",
        zIndex: -1,
    },
    "&:hover": {
        transform: "translateY(-2px) scale(1.1)",
        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
        "&::before": {
            opacity: 1,
        },
    },
}));

const LoginText = styled(Typography)(({ theme }) => ({
    cursor: "pointer",
    fontWeight: 600,
    padding: theme.spacing(1, 2),
    borderRadius: 20,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    color: "white",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "none",
    position: "relative",
    overflow: "hidden",
    "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: "-100%",
        width: "100%",
        height: "100%",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
        transition: "left 0.5s ease",
    },
    "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
        "&::before": {
            left: "100%",
        },
    },
    "&:active": {
        transform: "translateY(0px)",
    },
}));

const TitleContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'baseline', 
    gap: theme.spacing(0.5),
    position: 'relative',
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    fontSize: '1.5rem', 
    fontStyle: 'italic',
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, // ✅ Gradient
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
    '&:hover': {
        filter: 'brightness(1.2)', 
        transform: 'scale(1.02)',
    },
    [theme.breakpoints.down('md')]: {
        fontSize: '1.3rem',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.1rem',
    }
}));

const AdminSubscript = styled(Typography)(({ theme }) => ({
    fontSize: '0.65rem', 
    fontStyle: 'italic',
    fontWeight: 600,
    color: theme.palette.secondary.main, 
    alignSelf: 'flex-end', 
    marginBottom: '2px',
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
    opacity: 0.9,
    transition: 'all 0.3s ease',
    '&:hover': {
        opacity: 1,
        color: theme.palette.secondary.dark, 
    },
    [theme.breakpoints.down('sm')]: {
        display: 'none', 
    }
}));
const StyledAppBar = styled(AppBar)(({ theme }) => ({
    background: `linear-gradient(135deg, 
        ${alpha(theme.palette.background.paper, 0.95)} 0%, 
        ${alpha(theme.palette.background.default, 0.9)} 100%)`,
    backdropFilter: "blur(20px) saturate(180%)",
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
    color: theme.palette.text.primary,
    zIndex: theme.zIndex.drawer + 1,
    transition: "all 0.3s ease",
}));

const Header = ({ onToggleSidebar, user, setUser }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const { socket } = useSocket();
    const { email, setEmail, password, setPassword, openLogin, setOpenLogin, handleLogin, handleLogout } = useAuth(setUser, socket);

    const handleAvatarClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const avatarSrc = user?.avatar ? `${API_URL}${user.avatar}` : undefined;

    return (
        <>
            <StyledAppBar position="fixed">
                <Toolbar sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    pl: "16px", 
                    pr: "24px", 
                    minHeight: "70px !important",
                    py: 1
                }}>
                    {/* LEFT SECTION - Title + Subscript + Menu */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Fade in={true} timeout={1000}>
                            <TitleContainer>
                                {/* ✅ Main Title */}
                                <StyledTitle variant="h6">
                                    UID IOT
                                </StyledTitle>
                                <AdminSubscript>
                                    Administrator
                                </AdminSubscript>
                            </TitleContainer>
                        </Fade>
                        
                        {/* Menu Button */}
                        <Grow in={true} timeout={800}>
                            <StyledMenuButton color="inherit" onClick={onToggleSidebar}>
                                <CustomMenuIcon />
                            </StyledMenuButton>
                        </Grow>
                    </Box>

                    {/* Right Section - Search + Notification + User */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Fade in={true} timeout={1200}>
                            <Search>
                                <SearchIconWrapper>
                                    <SearchIcon />
                                </SearchIconWrapper>
                                <StyledInputBase
                                    placeholder="Tìm kiếm..."
                                    inputProps={{ "aria-label": "search" }}
                                />
                            </Search>
                        </Fade>

                        <NotificationBell user={user} />

                        <Fade in={true} timeout={1400}>
                            <Box>
                                {!user ? (
                                    <LoginText
                                        onClick={() => setOpenLogin(true)}
                                    >
                                        Đăng nhập
                                    </LoginText>
                                ) : (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Box sx={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            alignItems: "flex-end",
                                            mr: 1
                                        }}>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: theme.palette.text.primary,
                                                    lineHeight: 1.2
                                                }}
                                            >
                                                {user.username}
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: theme.palette.text.secondary,
                                                    fontSize: "0.75rem"
                                                }}
                                            >
                                                Online
                                            </Typography>
                                        </Box>
                                        <StyledAvatar
                                            src={avatarSrc}
                                            alt={user.username}
                                            onClick={handleAvatarClick}
                                        />
                                        <AvatarMenu
                                            anchorEl={anchorEl}
                                            onClose={handleMenuClose}
                                            user={user}
                                            setUser={setUser}
                                            onLogout={handleLogout}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Fade>
                    </Box>
                </Toolbar>
            </StyledAppBar>
            
            <LoginDialog
                open={openLogin}
                onClose={() => setOpenLogin(false)}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                handleLogin={handleLogin}
            />
        </>
    );
};

export default Header;