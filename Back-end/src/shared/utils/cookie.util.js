const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});

export const setAuthCookies = (res, accessToken, refreshToken) => {
    const options = getCookieOptions();

    res.cookie('accessToken', accessToken, {
        ...options,
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        ...options,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

export const clearAuthCookies = (res) => {
    const options = getCookieOptions();
    res.clearCookie('accessToken', options);
    res.clearCookie('refreshToken', options);
};