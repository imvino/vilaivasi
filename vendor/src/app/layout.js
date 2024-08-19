// app/layout.js

'use client'

import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

const theme = createTheme({
    palette: {
        primary: {
            main: '#00A3B1',
        },
        secondary: {
            main: '#9C27B0',
        },
    },
});

export default function RootLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <html lang="en">
        <body>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex' }}>
                <Header toggleSidebar={toggleSidebar} />
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        width: { sm: `calc(100% - ${isSidebarOpen ? 240 : 64}px)` },
                        // ml: { sm: isSidebarOpen ? `240px` : '64px' },
                        mt: ['56px', '64px'],
                        transition: theme.transitions.create(['margin', 'width'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    }}
                >
                    {children}
                </Box>
            </Box>
        </ThemeProvider>
        </body>
        </html>
    );
}