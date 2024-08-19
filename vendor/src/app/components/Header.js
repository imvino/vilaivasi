// components/Header.js

import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button, useMediaQuery, Box } from '@mui/material';
import { Menu as MenuIcon, Add as AddIcon, Notifications, Help, AccountCircle } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const Header = ({ toggleSidebar }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="toggle drawer"
                    edge="start"
                    onClick={toggleSidebar}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    Vilaivasi
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: 'secondary.main',
                        '&:hover': { bgcolor: 'secondary.dark' },
                        mr: 2
                    }}
                >
                    ADD
                </Button>
                {!isMobile && (
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        You have 13 days left in your trial. <a href="#" style={{ color: 'inherit' }}>Select a plan</a>
                    </Typography>
                )}
                <Box sx={{ display: 'flex' }}>
                    <IconButton color="inherit" size={isMobile ? "small" : "medium"}>
                        <Notifications />
                    </IconButton>
                    <IconButton color="inherit" size={isMobile ? "small" : "medium"}>
                        <Help />
                    </IconButton>
                    <IconButton color="inherit" size={isMobile ? "small" : "medium"}>
                        <AccountCircle />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;