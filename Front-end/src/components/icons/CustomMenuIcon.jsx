import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

const CustomMenuIcon = (props) => {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            {/* Gạch dài thứ 1 - Căn phải */}
            <rect x="0" y="5" width="40" height="2" rx="1" />
            
            {/* Gạch dài thứ 2 - Căn phải */}
            <rect x="0" y="12" width="40" height="2" rx="1" />
            
            {/* Gạch ngắn - Căn phải */}
            <rect x="12" y="19" width="20" height="2" rx="1" />
        </SvgIcon>
    );
};

export default CustomMenuIcon;