// components/Header.js

import React from 'react';
import { Layout, Button, Space } from 'antd';
import { PlusOutlined, BellOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

const Header = () => {
    return (
        <AntHeader style={{ padding: 0, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '0 16px' }}>
                <h1 style={{ margin: 0 }}>Vilaivasi</h1>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />}>
                        ADD
                    </Button>
                    <Button type="text" icon={<BellOutlined />} />
                </Space>
            </div>
        </AntHeader>
    );
};

export default Header;