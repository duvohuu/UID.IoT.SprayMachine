import React, { useState } from 'react';
import { 
    Box, 
    Grid, 
    Typography, 
    Card, 
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Alert,
    Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import MachineStatusCard from '../overview/MachineStatusCard'; 
import { useSnackbar } from '../../context/SnackbarContext';
import { deleteMachine } from '../../api/machineAPI'; 

const OverviewPageMachinesGrid = ({ machines, loading, user, onMachineClick, onMachineDelete }) => {
    const theme = useTheme();
    const { showSnackbar } = useSnackbar();
    const [deleteDialog, setDeleteDialog] = useState({ open: false, machine: null });

    const handleDeleteClick = (machine) => {
        setDeleteDialog({ open: true, machine });
    };

    const handleDeleteConfirm = async () => {
        const { machine: machineToDelete } = deleteDialog;
        if (!machineToDelete) return;

        try {
            console.log('   Deleting machine from DATABASE:');
            console.log('   Full machine object:', machineToDelete);
            console.log('   Machine ID:', machineToDelete.machineId);
            console.log('   MongoDB _id:', machineToDelete._id);
            console.log('   MongoDB id (no underscore):', machineToDelete.id);
            console.log('   Machine Name:', machineToDelete.name);
            
            const idToDelete = machineToDelete._id || machineToDelete.id || machineToDelete.machineId;
            
            if (!idToDelete) {
                console.error('No valid ID found on machine object!');
                showSnackbar('Lỗi: Không tìm thấy ID của máy', 'error');
                return;
            }            
            const result = await deleteMachine(idToDelete);
            
            if (result.success) {
                console.log('Machine DELETED from DATABASE successfully!');
                console.log('   Response:', result.data);
                showSnackbar(`Đã xóa máy ${machineToDelete.machineId || machineToDelete.name} khỏi database`, 'success');
                
                if (onMachineDelete) {
                    console.log('   Calling onMachineDelete to refresh UI...');
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await onMachineDelete(machineToDelete);
                }
            } else {
                console.error('❌ Failed to delete from database:', result.message);
                showSnackbar(result.message || 'Lỗi khi xóa máy khỏi database', 'error');
            }
            
        } catch (error) {
            console.error('❌ Delete machine error:', error);
            showSnackbar('Lỗi khi xóa máy khỏi database', 'error');
        } finally {
            setDeleteDialog({ open: false, machine: null });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, machine: null });
    };

    // Loading skeleton - 4 skeletons cho 4 máy
    if (loading) {
        return (
            <Box>
                <Typography 
                    variant="h5" 
                    sx={{ 
                        mb: 3, 
                        fontWeight: 700,
                        color: theme.palette.text.primary
                    }}
                >
                    Danh Sách Máy Móc
                </Typography>
                <Grid container spacing={2}> 
                    {Array.from({ length: 4 }).map((_, index) => ( // 4 skeleton thay vì 3
                        <Grid item xs={12} sm={6} md={3} lg={3} xl={3} key={index}> {/* md={3} cho 4 cột */}
                            <Card sx={{ height: user?.role === 'admin' ? 380 : 320, p: 2 }}>
                                <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                                <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                                <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
                                <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
                                <Skeleton variant="rectangular" height={40} />
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
        <Typography 
            variant="h5" 
            sx={{ 
                mb: 3, 
                fontWeight: 700,
                color: theme.palette.text.primary
            }}
        >
            {user?.role === 'admin' 
                ? `Tất Cả Máy Móc Trong Hệ Thống (${machines.length})`
                : `Máy Móc Của Bạn (${machines.length})`
            }
        </Typography>
        
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',                   // 1 cột mobile
                    sm: 'repeat(2, 1fr)',        // 2 cột tablet
                    md: 'repeat(4, 1fr)',        // 4 cột desktop - FORCE 4 columns
                    lg: 'repeat(4, 1fr)',        // 4 cột large
                    xl: 'repeat(4, 1fr)',        // 4 cột extra large
                },
                gap: 2,
                width: '100%',
                maxWidth: '100%',
                '& > *': {
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,  
                },
                '@media (min-width: 900px)': {  // Force 4 columns từ 900px trở lên
                    gridTemplateColumns: 'repeat(4, 1fr)',
                }
            }}
        >
            {machines.map((machine) => (
                <Box key={machine._id || machine.id}>
                    <MachineStatusCard
                        machine={machine}
                        user={user}
                        onClick={onMachineClick}
                        onDelete={user?.role === 'admin' ? handleDeleteClick : undefined}
                    />
                </Box>
            ))}
        </Box>

            {/* Delete Confirmation Dialog - unchanged */}
            <Dialog 
                open={deleteDialog.open} 
                onClose={handleDeleteCancel}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ 
                    bgcolor: 'error.main', 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DeleteIcon />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Xóa Máy Móc
                        </Typography>
                    </Box>
                    <IconButton 
                        onClick={handleDeleteCancel}
                        sx={{ color: 'white' }}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        ⚠️ Hành động này sẽ XÓA VĨNH VIỄN máy khỏi DATABASE và không thể hoàn tác!
                    </Alert>
                    
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Bạn có chắc chắn muốn xóa máy này khỏi database không?
                    </Typography>
                    
                    <Box sx={{ 
                        p: 2, 
                        backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)'  
                        : 'grey.50',                   
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.12)'  
                            : 'grey.200'  
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {deleteDialog.machine?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                                label={deleteDialog.machine?.machineId} 
                                size="small" 
                                color="primary"
                            />
                            <Chip 
                                label={deleteDialog.machine?.type} 
                                size="small" 
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button 
                        onClick={handleDeleteCancel}
                        variant="outlined"
                        sx={{ minWidth: 100 }}
                    >
                        Hủy
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        sx={{ minWidth: 120 }}
                    >
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OverviewPageMachinesGrid;