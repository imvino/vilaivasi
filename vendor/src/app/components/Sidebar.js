// components/Sidebar.js

import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Collapse, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Dashboard, ShoppingCart, Inventory, ExpandLess, ExpandMore } from '@mui/icons-material';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const [productsOpen, setProductsOpen] = React.useState(true);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleProductsClick = () => {
        setProductsOpen(!productsOpen);
    };

    const drawerContent = (
        <List>
            <ListItem button>
                <ListItemIcon><Dashboard /></ListItemIcon>
                {isOpen && <ListItemText primary="Dashboard" />}
            </ListItem>
            <ListItem button>
                <ListItemIcon><ShoppingCart /></ListItemIcon>
                {isOpen && <ListItemText primary="Point of Sale" />}
            </ListItem>
            <ListItem button onClick={handleProductsClick}>
                <ListItemIcon><Inventory /></ListItemIcon>
                {isOpen && <ListItemText primary="Products" />}
                {isOpen && (productsOpen ? <ExpandLess /> : <ExpandMore />)}
            </ListItem>
            {isOpen && (
                <Collapse in={productsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {['Products', 'Product types', 'Brands', 'Tags', 'Seasons', 'Gift cards', 'Discount offers', 'Print labels'].map((text) => (
                            <ListItem button key={text} sx={{ pl: 4 }}>
                                <ListItemText primary={text} />
                            </ListItem>
                        ))}
                    </List>
                </Collapse>
            )}
        </List>
    );

    return (
        <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            open={isMobile ? isOpen : true}
            onClose={toggleSidebar}
            sx={{
                width: isOpen ? 240 : 64,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: isOpen ? 240 : 64,
                    boxSizing: 'border-box',
                    top: ['56px', '64px'],
                    height: 'auto',
                    bottom: 0,
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    overflowX: 'hidden',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default Sidebar;