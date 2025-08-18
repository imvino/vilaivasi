import React, { useState } from 'react';
import { Drawer, List, Avatar } from 'antd';
import {
    HomeOutlined,
    ShoppingCartOutlined,
    AppstoreOutlined,
    UserOutlined,
    SettingOutlined,
    RightOutlined,
    DownOutlined
} from '@ant-design/icons';

const menuItems = [
    { key: 'home', icon: <HomeOutlined />, title: 'Home' },
    { key: 'pos', icon: <ShoppingCartOutlined />, title: 'Point of Sale' },
    {
        key: 'products',
        icon: <AppstoreOutlined />,
        title: 'Products',
        children: [
            { key: 'allProducts', title: 'All Products' },
            { key: 'categories', title: 'Categories' },
            { key: 'inventory', title: 'Inventory' },
        ],
    },
    { key: 'profile', icon: <UserOutlined />, title: 'Profile' },
    { key: 'settings', icon: <SettingOutlined />, title: 'Settings' }
];

const SocialMediaDrawer = ({ visible, onClose }) => {
    const [expandedKeys, setExpandedKeys] = useState([]);

    const toggleExpand = (key) => {
        setExpandedKeys(
            expandedKeys.includes(key)
                ? expandedKeys.filter((k) => k !== key)
                : [...expandedKeys, key]
        );
    };

    const renderMenuItem = (item) => (
        <List.Item
            key={item.key}
            style={{ padding: '16px 24px', cursor: 'pointer' }}
            onClick={() => item.children ? toggleExpand(item.key) : console.log(`Clicked ${item.title}`)}
        >
            <List.Item.Meta
                avatar={<Avatar icon={item.icon} />}
                title={item.title}
            />
            {item.children && (
                expandedKeys.includes(item.key) ? <DownOutlined /> : <RightOutlined />
            )}
        </List.Item>
    );

    const renderSubMenu = (subItems) => (
        <List
            itemLayout="horizontal"
            dataSource={subItems}
            renderItem={(subItem) => (
                <List.Item
                    style={{ padding: '12px 24px 12px 48px', cursor: 'pointer' }}
                    onClick={() => console.log(`Clicked ${subItem.title}`)}
                >
                    <List.Item.Meta title={subItem.title} />
                </List.Item>
            )}
        />
    );

    return (
        <Drawer
            placement="left"
            onClose={onClose}
            open={visible}
            width={300}
            closable={false}
            bodyStyle={{ padding: 0 }}
        >
            <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0' }}>
                <Avatar size={64} icon={<UserOutlined />} />
                <h3 style={{ marginTop: '16px', marginBottom: '4px' }}>John Doe</h3>
                <p style={{ color: '#8c8c8c', margin: 0 }}>@johndoe</p>
            </div>
            <List
                itemLayout="horizontal"
                dataSource={menuItems}
                renderItem={(item) => (
                    <>
                        {renderMenuItem(item)}
                        {item.children && expandedKeys.includes(item.key) && renderSubMenu(item.children)}
                    </>
                )}
            />
        </Drawer>
    );
};

export default SocialMediaDrawer;