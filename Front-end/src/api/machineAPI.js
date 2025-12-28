import axios from "axios";

axios.defaults.withCredentials = true;

const getApiUrl = () => {
    // If VITE_API_URL is set, use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

// Lấy danh sách tất cả máy từ mainServer
const getMachines = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/machines`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy danh sách máy" 
        };
    }
};

const getMachineByTopic = async (topic) => {
    try {
        // Encode topic để handle special characters và slashes
        const encodedTopic = encodeURIComponent(topic);
        const response = await axios.get(`${API_URL}/api/machines/topic/${encodedTopic}`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi tìm máy theo Topic" 
        };
    }
};

const getMachineByMachineId = async (machineId) => {
    try {
        const response = await axios.get(`${API_URL}/api/machines/machineId/${machineId}`, {
            withCredentials: true
        });
        
        if (response.data.success && response.data.machine) {
            return { 
                success: true, 
                data: response.data.machine 
            };
        }
        
        return { 
            success: false, 
            message: "Machine not found" 
        };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi tìm máy theo Machine ID" 
        };
    }
};

const getMachineById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/api/machines/${id}`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy thông tin máy" 
        };
    }
};

const deleteMachine = async (id) => {
    try {
        console.log('🗑️ Deleting machine with ID:', id);
        
        const response = await axios.delete(`${API_URL}/api/machines/${id}`, {
            withCredentials: true
        });
        
        console.log('✅ Delete response:', response.data);
        return { success: true, data: response.data };
    } catch (err) {
        console.error('❌ Delete error:', err.response?.data || err.message);
        return { 
            success: false, 
            message: err.response?.data?.message || err.response?.data?.error || "Lỗi khi xóa máy" 
        };
    }
};

const updateMachine = async (id, updateData) => {
    try {
        const response = await axios.put(`${API_URL}/api/machines/${id}`, updateData, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi cập nhật máy" 
        };
    }
};

const createMachine = async (machineData) => {
    try {
        const response = await axios.post(`${API_URL}/api/machines`, machineData, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi tạo máy mới" 
        };
    }
};

const getMachineStatus = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/api/machines/${id}/status`, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi lấy trạng thái máy" 
        };
    }
};

const updateMachineStatus = async (id, statusData) => {
    try {
        const response = await axios.patch(`${API_URL}/api/machines/${id}/status`, statusData, {
            withCredentials: true
        });
        return { success: true, data: response.data };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi cập nhật trạng thái máy" 
        };
    }
};

// EXPORT CẢ CŨ VÀ MỚI
export { 
    // Core CRUD operations
    getMachines, 
    getMachineById, 
    createMachine,
    updateMachine,
    deleteMachine,
    
    // Search operations
    getMachineByTopic,         
    getMachineByMachineId,      
    
    // Status operations
    getMachineStatus,           
    updateMachineStatus,        
               
};