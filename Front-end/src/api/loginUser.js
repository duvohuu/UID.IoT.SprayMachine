import axios from "axios";

axios.defaults.withCredentials = true;

const loginUser = async (email, password) => {
    try {
        // Clear old tokens
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");

        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
            email,
            password,
        });
        
        const { user, accessToken } = res.data;
        
        const userData = {
            userId: user.userId,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar
        };
        
        localStorage.setItem("user", JSON.stringify(userData));
        if (accessToken) {
            localStorage.setItem("token", accessToken);
        }
        
        return { 
            success: true, 
            ...userData
        };
    } catch (err) {
        return { 
            success: false, 
            message: err.response?.data?.message || "Lỗi đăng nhập" 
        };
    }
};

export default loginUser;