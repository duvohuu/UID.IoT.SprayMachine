import React, { useState } from "react";
import { 
    Dialog, 
    Box, 
    Typography, 
    TextField, 
    Button,
    IconButton,
    InputAdornment,
    Alert
} from "@mui/material";
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from "@mui/icons-material";

const ChangePasswordDialog = ({
    open,
    onClose,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    handleChangePassword,
}) => {
    // State cho confirm password
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // State cho show/hide password
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // State cho validation error
    const [error, setError] = useState("");

    // Handle submit với validation
    const handleSubmit = () => {
        // Reset error
        setError("");

        // Validate empty fields
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("Vui lòng điền đầy đủ thông tin");
            return;
        }

        // Validate password match
        if (newPassword !== confirmPassword) {
            setError("Mật khẩu mới không khớp");
            return;
        }

        // Validate password length
        if (newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        // Validate new password different from old
        if (oldPassword === newPassword) {
            setError("Mật khẩu mới phải khác mật khẩu cũ");
            return;
        }

        // Call parent handler
        handleChangePassword();
        
        // Reset confirm password
        setConfirmPassword("");
    };

    // Handle close dialog
    const handleClose = () => {
        setError("");
        setConfirmPassword("");
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                    🔒 Đổi mật khẩu
                </Typography>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                        {error}
                    </Alert>
                )}

                {/* Mật khẩu cũ */}
                <TextField
                    label="Mật khẩu cũ"
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    edge="end"
                                    size="small"
                                >
                                    {showOldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                {/* Mật khẩu mới */}
                <TextField
                    label="Mật khẩu mới"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    required
                    helperText="Tối thiểu 6 ký tự"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    edge="end"
                                    size="small"
                                >
                                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                {/* Xác nhận mật khẩu mới */}
                <TextField
                    label="Xác nhận mật khẩu mới"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    required
                    error={confirmPassword && newPassword !== confirmPassword}
                    helperText={
                        confirmPassword && newPassword !== confirmPassword 
                            ? "Mật khẩu không khớp" 
                            : ""
                    }
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    edge="end"
                                    size="small"
                                >
                                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                {/* Buttons */}
                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <Button 
                        variant="outlined" 
                        onClick={handleClose}
                        fullWidth
                    >
                        Hủy
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        fullWidth
                        disabled={!oldPassword || !newPassword || !confirmPassword}
                    >
                        Xác nhận
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default ChangePasswordDialog;