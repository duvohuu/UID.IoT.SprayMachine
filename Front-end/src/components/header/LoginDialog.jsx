import React, { useState } from 'react';
import { 
    Dialog, 
    Box, 
    Typography, 
    TextField, 
    Button,
    IconButton,
    InputAdornment
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

const LoginDialog = ({ open, onClose, email, setEmail, password, setPassword, handleLogin }) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = () => {
        handleLogin();
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    🔐 Đăng nhập
                </Typography>
                
                <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    fullWidth
                    required
                    autoComplete="email"
                />
                
                <TextField
                    label="Mật khẩu"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    fullWidth
                    required
                    autoComplete="current-password"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                    size="small"
                                >
                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Button 
                        variant="outlined" 
                        onClick={onClose}
                        fullWidth
                    >
                        Hủy
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        fullWidth
                        disabled={!email || !password}
                    >
                        Đăng nhập
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default LoginDialog;