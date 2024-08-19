// app/layout.js

'use client'

import React, { useState } from 'react';
import { Layout as AntLayout, theme } from 'antd';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const { Content, Footer } = AntLayout;
export default function RootLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    return (
        <html lang="en">
        <body style={{ margin: 0, padding: 0 }}>
        <AntLayout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={setCollapsed}/>
            <AntLayout>
                <Header/>
                <Content style={{ margin: '0 16px' }}>
                    <div
                        style={{
                            padding: 24,
                            minHeight: 360,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                            marginTop: 16,
                        }}
                    >
                        {children}
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    Vilaivasi ©{new Date().getFullYear()} Created by Your Company
                </Footer>
            </AntLayout>
        </AntLayout>
        </body>
        </html>
    );
}