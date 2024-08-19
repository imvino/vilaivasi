// app/add-product/page.js

'use client'

import React, { useState } from 'react';
import {
    Typography, Row, Col, Card, Radio, Input, Checkbox, Button, Switch, Select, Form, Space, Upload
} from 'antd';
import { CameraOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const AddProductPage = () => {
    const [productType, setProductType] = useState('simple');
    const [inventory, setInventory] = useState(false);
    const [form] = Form.useForm();

    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: 24 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                    <Title level={4}>Add product</Title>
                    <Button type="link">Learn</Button>
                </Row>

                <Form form={form} layout="vertical">
                    <Row gutter={24}>
                        {/* Left Column */}
                        <Col xs={24} lg={16}>
                            <Card style={{ marginBottom: 24 }}>
                                <Title level={5} type="primary">PRODUCT TYPE</Title>
                                <Radio.Group
                                    value={productType}
                                    onChange={(e) => setProductType(e.target.value)}
                                >
                                    <Space direction="vertical">
                                        <Radio value="simple">Simple product, no variants</Radio>
                                        <Radio value="variants">Product with variants</Radio>
                                        <Radio value="composite">Composite product</Radio>
                                    </Space>
                                </Radio.Group>
                            </Card>

                            <Card style={{ marginBottom: 24 }}>
                                <Title level={5} type="primary">PRIMARY INFORMATION</Title>
                                <Form.Item name="productName" label="Product name" required>
                                    <Input />
                                </Form.Item>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="sku" label="SKU">
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="barcode" label="Barcode">
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="supplierCode" label="Supplier code">
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="customField" label="Custom field">
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item name="serialNumberEnabled" valuePropName="checked">
                                    <Checkbox>
                                        Serial number enabled product. Prompt cashier to enter serial number at checkout.
                                    </Checkbox>
                                </Form.Item>
                                <Form.Item name="partOfComposite" valuePropName="checked">
                                    <Checkbox>
                                        Part of a composite product, cannot be sold individually.
                                    </Checkbox>
                                </Form.Item>
                                <Form.Item name="description" label="Description">
                                    <TextArea rows={4} />
                                </Form.Item>
                            </Card>

                            <Card style={{ marginBottom: 24 }}>
                                <Title level={5} type="primary">INVENTORY</Title>
                                <Text>Track inventory for this product</Text>
                                <br />
                                <Text type="secondary">
                                    Would you like Hike to track inventory movement for this product?
                                </Text>
                                <br />
                                <Form.Item name="inventoryTracking" valuePropName="checked">
                                    <Switch
                                        checked={inventory}
                                        onChange={setInventory}
                                        checkedChildren="On"
                                        unCheckedChildren="Off"
                                    />
                                </Form.Item>
                            </Card>

                            <Card style={{ marginBottom: 24 }}>
                                <Title level={5} type="primary">PRICING</Title>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item name="costPrice" label="Cost price">
                                            <Input type="number" defaultValue="0.00" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item name="markup" label="Mark-up %">
                                            <Input type="number" defaultValue="0.00" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item name="retailExTax" label="Retail (Ex. Tax)">
                                            <Input type="number" defaultValue="0.00" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="taxRate" label="Tax rate">
                                            <Select defaultValue="">
                                                <Select.Option value="">No Tax</Select.Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="retailIncTax" label="Retail price (Inc. Tax)">
                                            <Input type="number" defaultValue="0.00" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card style={{ marginBottom: 24 }}>
                                <Title level={5} type="primary">ADDITIONAL UNIT OF MEASURES</Title>
                                <Form.Item name="additionalUnitOfMeasures" valuePropName="checked">
                                    <Checkbox>Activate additional unit of measures</Checkbox>
                                </Form.Item>
                            </Card>
                        </Col>

                        {/* Right Column */}
                        <Col xs={24} lg={8}>
                            <Card style={{ marginBottom: 24, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Upload>
                                    <Button icon={<CameraOutlined />} size="large" />
                                </Upload>
                            </Card>

                            <Card style={{ marginBottom: 24 }}>
                                <Title level={5} type="primary">SALES CHANNELS</Title>
                                <Form.Item name="pointOfSale" valuePropName="checked">
                                    <Checkbox>Point of Sale</Checkbox>
                                </Form.Item>
                                <Form.Item name="ecommerce" valuePropName="checked">
                                    <Checkbox>Ecommerce</Checkbox>
                                </Form.Item>
                            </Card>

                            <Card style={{ marginBottom: 24 }}>
                                <Title level={5} type="primary">CATEGORIZE</Title>
                                <Form.Item name="productTypes" label="Product types">
                                    <Select placeholder="Select or add new type...">
                                        <Select.Option value="">Select or add new type...</Select.Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="suppliers" label="Suppliers">
                                    <Select placeholder="Select or add new...">
                                        <Select.Option value="">Select or add new...</Select.Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="brand" label="Brand">
                                    <Input placeholder="Start typing brand name..." />
                                </Form.Item>
                                <Form.Item name="tags" label="Tags">
                                    <Select placeholder="Select or add new...">
                                        <Select.Option value="">Select or add new...</Select.Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item name="season" label="Season">
                                    <Input placeholder="Start typing season..." />
                                </Form.Item>
                                <Form.Item name="loyaltyPoints" label="Additional loyalty points">
                                    <Input type="number" defaultValue="0" />
                                </Form.Item>
                            </Card>

                            <Card style={{ marginBottom: 24 }}>
                                <Title level={5} type="primary">OPTIONAL EXTRAS</Title>
                                <Form.Item name="searchProduct">
                                    <Select placeholder="Search for Product">
                                        <Select.Option value="">Search for Product</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Card>
                        </Col>
                    </Row>

                    {/* Action Buttons */}
                    <Row justify="end" style={{ marginTop: 24 }}>
                        <Space>
                            <Button>CANCEL</Button>
                            <Button type="primary">SAVE</Button>
                        </Space>
                    </Row>
                </Form>
            </div>
        </div>
    );
};

export default AddProductPage;