// components/Sidebar.js

import React from 'react';
import { Layout, Menu } from 'antd';
import { HomeOutlined, ShoppingCartOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Sider } = Layout;

function getItem(label, key, icon, children) {
    return {
        key,
        icon,
        children,
        label,
    };
}

const items = [
    getItem('Dashboard', '1', <HomeOutlined />),
    getItem('Point of Sale', '2', <ShoppingCartOutlined />),
    getItem('Products', 'sub1', <AppstoreOutlined />, [
        getItem('All Products', '3'),
        getItem('Categories', '4'),
        getItem('Inventory', '5'),
    ]),
];

const Sidebar = ({ collapsed, onCollapse }) => {
    return (
        <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
            <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
            <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={items} />
        </Sider>
    );
};

export default Sidebar;