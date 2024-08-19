"use client"
import React, { useState } from 'react';
import { Layout, Menu, Button, Drawer } from 'antd';
import {
    MenuOutlined,
    HomeOutlined,
    ShoppingCartOutlined,
    AppstoreOutlined,
    PlusOutlined,
    BellOutlined
} from '@ant-design/icons';
import SocialMediaDrawer from './components/SocialMediaDrawer';

const { Header, Sider, Content, Footer } = Layout;

const menuItems = [
    { key: '1', icon: <HomeOutlined />, label: 'Dashboard' },
    { key: '2', icon: <ShoppingCartOutlined />, label: 'Point of Sale' },
    {
        key: 'sub1',
        icon: <AppstoreOutlined />,
        label: 'Products',
        children: [
            { key: '3', label: 'All Products' },
            { key: '4', label: 'Categories' },
            { key: '5', label: 'Inventory' },
        ],
    },
];

export default function RootLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    const toggleDrawer = () => {
        setDrawerVisible(!drawerVisible);
    };

    const sidebar = (
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} breakpoint='lg'
               collapsedWidth={isMobile ? 0 : 80}>
            <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }}/>
            <Menu theme='dark' defaultSelectedKeys={['1']} mode='inline' items={menuItems}/>
        </Sider>
    );

    return (
        <html lang='en'>
        <body style={{ margin: 0, padding: 0 }}>
        <Layout style={{ minHeight: '100vh' }}>
            {!isMobile && sidebar}
            <Layout>
                <Header style={{ padding: 0, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 16px' }}>
                        {isMobile && (
                            <Button type="text" icon={<MenuOutlined />} onClick={toggleDrawer} />
                        )}
                        <h1 style={{ margin: 0 }}>Vilaivasi</h1>
                        <div>
                            <Button type="primary" icon={<PlusOutlined />} style={{ marginRight: 8 }}>
                                ADD
                            </Button>
                            <Button type="text" icon={<BellOutlined />} />
                        </div>
                    </div>
                </Header>
                <Content style={{ margin: '0 16px' }}>
                    <div style={{ padding: 5, minHeight: 360, background: '#fff', marginTop: 16 }}>
                        {children}
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    Vilaivasi ©{new Date().getFullYear()} Created by Your Company
                </Footer>
            </Layout>
            {isMobile && (
                <SocialMediaDrawer
                    visible={drawerVisible}
                    onClose={() => setDrawerVisible(false)}
                />
            )}
        </Layout>
        </body>
        </html>
    );
}